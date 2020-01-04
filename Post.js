import Router from '@koa/router'
import Mongo from 'mongodb'
import fetch from 'node-fetch'
import sizeOf from 'image-size'

export const getImageDimensions = async uri => {
    let response

    try {
        response = await fetch(
            encodeURI(uri),
            {
                method: 'GET'
            }
        )
    } catch (_) {
        return null
    }

    if (response.status !== 200) {
        return null
    }

    const buffer = await response.arrayBuffer()

    return sizeOf(Buffer.from(buffer))
}

const Post = new Router()

Post.post('/posts', async (ctx, next) => {
    const {
        request: { body },
        db
    } = ctx

    const {
        type,
        title,
        content,
        sharingTo,
        videos,
        photos,
        postedBy,
        postedIn,
        place,
        rating,
        ratingDetails
    } = body

    const foundUser = await db
        .collection(process.env.DB_COLLECTION_USER)
        .find({ _id: Mongo.ObjectId(postedBy) })
        .toArray()

    if (foundUser.length === 0) {
        ctx.status = 403
        ctx.body = {
            error: {
                message: 'User not found'
            }
        }

        return next()
    }

    if (postedIn) {
        const foundPage = await db
            .collection(process.env.DB_COLLECTION_PAGE)
            .find({ _id: Mongo.ObjectId(postedIn) })
            .toArray()

        if (foundPage.length === 0) {
            ctx.status = 403
            ctx.body = {
                error: {
                    message: 'Page not found'
                }
            }

            return next()
        }
    }

    let photosWithMeta = []

    if (Array.isArray(photos)) {
        photosWithMeta = await Promise.all(photos.map(async uri => {
            const obj = {
                uri
            }

            try {
                const metadata = await getImageDimensions(uri)

                return {
                    ...obj,
                    ...metadata
                }
            } catch (e) {
                return obj
            }
        }))
    }

    try {
        const result = await db
            .collection(process.env.DB_COLLECTION_POST)
            .insertOne({
                type,
                title,
                content,
                sharingTo,
                videos,
                photos: photosWithMeta,
                postedBy,
                postedIn,
                place,
                rating,
                ratingDetails
            })

        if (result.insertedCount === 1) {
            ctx.status = 200
            ctx.body = result.ops[0]
        }
    } catch (e) {
        ctx.status = 400
        ctx.body = {
            error: {
                code: e.code,
                message: e.message,
                stack: e.stack
            }
        }
    }

    await next()
})

Post.get('/posts', async (ctx, next) => {
    const {
        db,
        request: { query }
    } = ctx

    const filter = {}

    if (query.of === 'user') {
        filter.postedIn = { $eq: null }
    }

    if (query.of === 'page') {
        filter.postedIn = { $ne: null }
    }

    const result = await db
        .collection(process.env.DB_COLLECTION_POST)
        .find(filter)
        .toArray()

    // await Promise.all(result.map(async res => {
    //     if (res.photos) {
    //         res.photos = await Promise.all(res.photos.map(async element => {
    //             if (typeof element === 'string') {
    //                 const obj = {}
    //
    //                 if (element.startsWith('http://') || element.startsWith('https://')) {
    //                     obj.uri = element
    //                 } else {
    //                     obj.uri = `http://${element}`
    //                 }
    //
    //                 const image = await getImageDimensions(element).catch(() => null)
    //
    //                 if (image === null) {
    //                     return obj
    //                 }
    //
    //                 return {
    //                     ...obj,
    //                     ...image
    //                 }
    //             }
    //
    //             return element
    //         }))
    //     }

//     return db
//         .collection(process.env.DB_COLLECTION_POST)
//         .findOneAndReplace(
//             { _id: Mongo.ObjectId(res._id) },
//             {
//                 ...res
//             },
//             {
//                 returnOriginal: false
//             }
//         )
// })
// )

    ctx.status = 200
    ctx.body = { data: result }

    await next()
})

Post.put('/posts/:id', async (ctx, next) => {
    const {
        db,
        params,
        request: { body }
    } = ctx

    const foundUser = await db
        .collection(process.env.DB_COLLECTION_USER)
        .find({ _id: Mongo.ObjectId(body.postedBy) })
        .toArray()

    if (foundUser.length === 0) {
        ctx.status = 403
        ctx.body = {
            error: {
                message: 'User not found'
            }
        }

        return next()
    }

    if (body.postedIn) {
        const foundPage = await db
            .collection(process.env.DB_COLLECTION_PAGE)
            .find({ _id: Mongo.ObjectId(body.postedIn) })
            .toArray()

        if (foundPage.length === 0) {
            ctx.status = 403
            ctx.body = {
                error: {
                    message: 'Page not found'
                }
            }

            return next()
        }
    }

    const filter = {
        _id: Mongo.ObjectId(params.id)
    }

    const result = await db
        .collection(process.env.DB_COLLECTION_POST)
        .findOneAndReplace(
            filter,
            {
                ...body
            },
            {
                returnOriginal: false
            }
        )

    if (result.ok) {
        ctx.status = 200
        ctx.body = result.value
    } else {
        ctx.status = 400
        ctx.body = {
            error: {
                code: result.lastErrorObject.code,
                message: result.lastErrorObject.message,
                stack: result.lastErrorObject.stack
            }
        }
    }

    await next()
})

Post.del('/posts/:id', async (ctx, next) => {
    const { db, params } = ctx

    const filter = {
        _id: Mongo.ObjectId(params.id)
    }

    const result = await db
        .collection(process.env.DB_COLLECTION_POST)
        .findOneAndDelete(filter)

    if (result.ok) {
        ctx.status = 204
        ctx.body = result.value
    } else {
        ctx.status = 400
        ctx.body = {
            error: {
                code: result.lastErrorObject.code,
                message: result.lastErrorObject.message,
                stack: result.lastErrorObject.stack
            }
        }
    }

    await next()
})

export default Post
