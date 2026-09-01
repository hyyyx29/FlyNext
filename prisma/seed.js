const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
	await prisma.$transaction([
		prisma.airport.deleteMany(),
		prisma.city.deleteMany(),
	]);
	// 种子城市数据
	const cities = JSON.parse(
		fs.readFileSync("prisma/seed_data/cities.json", "utf-8")
	);

	await prisma.city.createMany({
		data: cities.map((city) => ({
			name: city.city,
			country: city.country,
		})),
	});

	// 建立城市名称与ID映射
	const cityRecords = await prisma.city.findMany();
	const cityNameToId = new Map(
		cityRecords.map((city) => [city.name, city.id])
	);

	// 种子机场数据
	const airports = JSON.parse(
		fs.readFileSync("prisma/seed_data/airports.json", "utf-8")
	);

	await prisma.airport.createMany({
		data: airports.map((airport) => {
			const cityId = cityNameToId.get(airport.city);
			if (!cityId) {
				throw new Error(`City not found: ${airport.city}`);
			}
			return {
				externalId: airport.id,
				code: airport.code,
				name: airport.name,
				cityId: cityId,
				country: airport.country,
			};
		}),
	});
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
