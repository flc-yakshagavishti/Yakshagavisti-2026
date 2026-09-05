import { PrismaClient } from "@prisma/client";

const defaultCharacters = [
  "MITRASAHA",
  "MADAYANTHI",
  "VANAPAALAKA",
  "DHEERGHAAKSHA",
  "DHOOMRAAKSHA",
  "VASISHTA",
  "MEGHAVARNA",
  "DEVENDRA",
  "NARADA",
];

const prisma = new PrismaClient();
const colleges = [
  {
    name: "St Aloysius College, Mangalore",
    teamName: "ಪಾಂಚಾಲ",
  },
  {
    name: "Vivekananda College of Arts, Science and Commerce (Autonomous)",
    teamName: "ಕುಂತಲ",
  },
  {
    name: "Sri Durgaparameshwari Temple First Grade College",
    teamName: "ಗಾಂಧಾರ",
  },
  {
    name: "Sahyadri College Of Engineering & Management (Autonomous)",
    teamName: " ಕೋಸಲ",
  },
  {
    name: "Alva’s college",
    teamName: "NOT_DECIDED",
  },
];

async function main() {
  await prisma.competitionSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", allowTeamFormation: false },
  });

  for (const [index, college] of colleges.entries()) {
    const { name, teamName } = college;

    await prisma.college.create({
      data: {
        name,
        password: "hello",
        Team: {
          create: {
            name: teamName,
            number: index + 1,
          },
        },
      },
    });
  }

  await prisma.prasanga.upsert({
    where: { name: "Default Prasanga" },
    update: {},
    create: {
      name: "Default Prasanga",
      characters: {
        create: defaultCharacters.map((character) => ({ character })),
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Data seeded successfully");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    console.error("Error seeding data");
    process.exit(1);
  });
