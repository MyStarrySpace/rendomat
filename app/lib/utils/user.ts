import prisma from "@/lib/prisma";

export async function getOrCreateUser(stackUserId: string, email: string) {
  let user = await prisma.user.findUnique({
    where: { stackUserId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        stackUserId,
        email,
        credits: 10, // signup bonus
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
