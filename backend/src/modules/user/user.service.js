import prisma from '../../config/db.js';

const getUsers = async (search) => {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 10,
  });

  return users;
};

export default { getUsers };
