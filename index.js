import env from 'dotenv'
import Koa from 'koa'
import BodyParser from 'koa-bodyparser'
import Cors from '@koa/cors'
import Mongo from 'mongodb'

import User from './User.js'
import Page from './Page.js'

env.config()

const app = new Koa()
app.use(Cors())
app.use(BodyParser())
app.use(async (ctx, next) => {
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@astra-loggl.mongodb.net/test?retryWrites=true&w=majority`
    const client = new Mongo.MongoClient(uri, {useNewUrlParser: true})

    await client.connect()

    ctx.db = client.db(process.env.DB_NAME)

    await next()
})

app.use(User.routes())
app.use(Page.routes())

app.listen(2222)

