import amqplib from "amqplib";

async function connectMQ() {
    try {
        const connection = await amqplib.connect("amqp://dev:devpass@rabbitmq");
        const channel = await connection.createChannel();
        return channel;
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
        throw error;
    }
}

export default connectMQ;