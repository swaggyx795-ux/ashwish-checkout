import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const masterKeys = [
    "eD8yU2qW5aH0oP9mN1xZ7cK4vL3jF6tB9rS0gI5uY2hT8eR1wQ7pA4k9",
    "rT4kV7yI0sM2zX9qF5cW8bP1nG6hD3oJ9aL2vE8uR5tY1mN7xZ0cK4a2",
    "jF1hY6uE9qW3sA7dG0kP4lZ8xV2cM5nB9vC1mX7zL4kJ0hG6fD3sA8x5",
    "aS6dF1gH9jK4lP0oI5uY6tR2eW9qQ1wE8rT2yU7iO3pA2sD7fG3hJ0v8",
    "mN5bV8cC3xZ6sA9pD4oI0uY5tR2eW7qQ1wE8rT2yU7iO3pA2sD7fG3m1",
    "pQ1wE8rT2yU7iO3sA1fG0hJ5kR4tY9uI2oP7lK3jH8gF3dS7aA2pP0n4",
    "cK4vL3jF6tB9rS0gI5uY2hT8eR1wQ7pA4eD8yU2qW5aH0oP9mN1xZ7b6",
    "xZ0cK4vL3jF6tB9rS0gI5uY2hT8eR1wQ7pA4eD8yU2qW5aH0oP9mN1c3",
    "tY1mN7xZ0cK4vL3jF6tB9rS0gI5uY2hT8eR1wQ7pA4eD8yU2qW5aH0v2",
    "bP1nG6hD3oJ9aL2vE8uR5tY1mN7xZ0cK4vL3jF6tB9rS0gI5uY2hT8y7",
    "kP4lZ8xV2cM5nB9vC1mX7zL4kJ0hG6fD3sA8jF1hY6uE9qW3sA7dG0z9",
    "uY6tR2eW9qQ1wE8rT2yU7iO3pA2sD7fG3hJ0aS6dF1gH9jK4lP0oI5f1",
    "iO3pA2sD7fG3hJ0kL5zX6cV9bN4mQ1wE8rT2yU7mN5bV8cC3xZ6sA9d4",
    "hJ5kR4tY9uI2oP7lK3jH8gF3dS7aA2pP0pQ1wE8rT2yU7iO3sA1fG0h7",
    "gI5uY2hT8eR1wQ7pA4eD8yU2qW5aH0oP9mN1cK4vL3jF6tB9rS0xZ7j2",
    "wQ7pA4eD8yU2qW5aH0oP9mN1cK4vL3jF6tB9rS0gI5uY2hT8eR1xZ0p8",
  ];

  console.log("Seeding database with master keys...");

  for (const key of masterKeys) {
    await prisma.licenseKey.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }

  console.log("Database successfully seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });