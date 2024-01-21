import { PutObjectCommand } from "@aws-sdk/client-s3";
import fastify from "fastify";
import { r2 } from '../lib/cloudflare' 
import {randomUUID} from 'node:crypto'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {z } from 'zod'
import {PrismaClient} from '@prisma/client'


const app = fastify()

const prisma = new PrismaClient()

app.post('/uploads', async  (request) => {
    const uploadBodySchema = z.object({
        name: z.string().min(1),
        contentType: z.string().regex(/\w+\/[-+.\w]+/),
    })

    const {name, contentType} = uploadBodySchema.parse(request.body)

    const fileKey = randomUUID().concat('-').concat(name)

    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: 'testo-to-r2',
        Key: 'file.pdf',
        ContentType: contentType
      }),
      { expiresIn: 600},
    )

    await prisma.file.create({
        data: {
            name,
            contentType,
            key: fileKey,
        }
    })
    
    return signedUrl
})
app.listen({
    port: 3333,
    host: '0.0.0.0',
}).then(() => {
    console.log('HTTP server running!')
})