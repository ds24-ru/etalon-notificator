module.exports = {
    port: number,
    secret: string,
    host: string,
    transport_port: number,
    secure: boolean,
    pool: boolean,
    maxConnections: number,
    maxMessages: number || Infinity,
    user: string,
    pass: string
}