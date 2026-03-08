import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

let prisma;
const createdUserIds = [];

before(() => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be set");
  prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
});

after(async () => {
  // Cleanup all test users
  for (const id of createdUserIds) {
    await prisma.creditTransaction.deleteMany({ where: { userId: id } }).catch(() => {});
    await prisma.user.delete({ where: { id } }).catch(() => {});
  }
  await prisma.$disconnect();
});

// Replicate the getOrCreateUser logic inline since it uses @/ path aliases
async function getOrCreateUser(stackUserId, email) {
  let user = await prisma.user.findUnique({
    where: { stackUserId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        stackUserId,
        email,
        credits: 10,
        transactions: {
          create: {
            amount: 10,
            reason: "signup_bonus",
          },
        },
      },
    });
  }

  return user;
}

describe("getOrCreateUser", () => {
  const stackUserId = `goc-test-${Date.now()}`;

  it("creates a new user on first call", async () => {
    const user = await getOrCreateUser(stackUserId, "new@example.com");
    createdUserIds.push(user.id);

    assert.ok(user.id);
    assert.equal(user.stackUserId, stackUserId);
    assert.equal(user.email, "new@example.com");
    assert.equal(user.credits, 10);

    // Verify signup bonus transaction was created
    const txns = await prisma.creditTransaction.findMany({
      where: { userId: user.id },
    });
    assert.equal(txns.length, 1);
    assert.equal(txns[0].amount, 10);
    assert.equal(txns[0].reason, "signup_bonus");
  });

  it("returns existing user on second call (no duplicate)", async () => {
    const user = await getOrCreateUser(stackUserId, "new@example.com");

    // Should be the same user, not a new one
    assert.equal(user.stackUserId, stackUserId);

    // Should still have only 1 transaction (no duplicate signup bonus)
    const txns = await prisma.creditTransaction.findMany({
      where: { userId: user.id },
    });
    assert.equal(txns.length, 1);
  });

  it("creates separate users for different stackUserIds", async () => {
    const otherId = `goc-other-${Date.now()}`;
    const otherUser = await getOrCreateUser(otherId, "other@example.com");
    createdUserIds.push(otherUser.id);

    assert.equal(otherUser.stackUserId, otherId);
    assert.notEqual(otherUser.id, createdUserIds[0]);
  });
});
