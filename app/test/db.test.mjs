import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

let prisma;

before(() => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be set");
  prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
});

after(async () => {
  await prisma?.$disconnect();
});

describe("Database connection", () => {
  it("connects to Neon", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    assert.equal(result[0].ok, 1);
  });
});

describe("User model", () => {
  let testUser;
  const stackUserId = `test-${Date.now()}`;

  after(async () => {
    if (testUser) {
      await prisma.creditTransaction.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  it("creates a user with signup bonus transaction", async () => {
    testUser = await prisma.user.create({
      data: {
        stackUserId,
        email: "test@example.com",
        name: "Test User",
        credits: 10,
        transactions: {
          create: { amount: 10, reason: "signup_bonus" },
        },
      },
      include: { transactions: true },
    });

    assert.ok(testUser.id);
    assert.equal(testUser.email, "test@example.com");
    assert.equal(testUser.credits, 10);
    assert.equal(testUser.transactions.length, 1);
    assert.equal(testUser.transactions[0].reason, "signup_bonus");
  });

  it("finds user by stackUserId (unique constraint)", async () => {
    const found = await prisma.user.findUnique({
      where: { stackUserId },
    });
    assert.ok(found);
    assert.equal(found.id, testUser.id);
  });

  it("rejects duplicate stackUserId", async () => {
    await assert.rejects(
      () =>
        prisma.user.create({
          data: {
            stackUserId, // same as testUser
            email: "other@example.com",
          },
        }),
      (err) => {
        assert.ok(err.code === "P2002", "Expected unique constraint violation");
        return true;
      }
    );
  });

  it("updates user credits", async () => {
    const updated = await prisma.user.update({
      where: { id: testUser.id },
      data: { credits: { decrement: 3 } },
    });
    assert.equal(updated.credits, 7);
  });
});

describe("CreditTransaction model", () => {
  let testUser;

  before(async () => {
    testUser = await prisma.user.create({
      data: {
        stackUserId: `txn-test-${Date.now()}`,
        email: "txn@example.com",
        credits: 0,
      },
    });
  });

  after(async () => {
    if (testUser) {
      await prisma.creditTransaction.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  it("creates multiple transactions for a user", async () => {
    await prisma.creditTransaction.createMany({
      data: [
        { userId: testUser.id, amount: 10, reason: "signup_bonus" },
        { userId: testUser.id, amount: -1, reason: "render", videoId: 42 },
        { userId: testUser.id, amount: 50, reason: "purchase", stripeSessionId: "cs_test_123" },
      ],
    });

    const txns = await prisma.creditTransaction.findMany({
      where: { userId: testUser.id },
      orderBy: { createdAt: "asc" },
    });

    assert.equal(txns.length, 3);
    assert.equal(txns[0].reason, "signup_bonus");
    assert.equal(txns[1].amount, -1);
    assert.equal(txns[1].videoId, 42);
    assert.equal(txns[2].stripeSessionId, "cs_test_123");
  });

  it("cascades: cannot create transaction for nonexistent user", async () => {
    await assert.rejects(
      () =>
        prisma.creditTransaction.create({
          data: { userId: "nonexistent-id", amount: 5, reason: "test" },
        }),
      (err) => {
        assert.ok(err.code === "P2003", "Expected foreign key constraint violation");
        return true;
      }
    );
  });
});
