import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;

// docker exec -it local_rabbitmq rabbitmqctl add_user admin admin123
// docker exec -it local_rabbitmq rabbitmqctl set_user_tags admin administrator
// docker exec -it local_rabbitmq rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"