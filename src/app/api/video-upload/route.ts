import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { rejects } from 'assert';
import { v2 as cloudinary, UploadStream } from 'cloudinary';
import { error } from 'console';
import { NextRequest, NextResponse } from 'next/server';
import { resolve } from 'path';

const prisma =new PrismaClient()

cloudinary.config({ 
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET  // Click 'View API Keys' above to copy your API secret
  });
    
interface cloudinaryUploadResult {
    public_id: string;
    bytes: number
    duration?: number
    [key: string]:any
}
    
export async function POST(request: NextRequest) {
 
    const { userId } = auth()
    
    if (!userId) {
        return NextResponse.json({error:"userid not found"},{status:401 })
    }

    if (
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ) {
        return NextResponse.json({error:"Cloudinary credentials not valid"},{status:500})
    }

    try {
        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const originalSize  = formData.get("originalSize") as string

        if (!file) {
            return NextResponse.json({error: "File not found "}), {status:400}
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<cloudinaryUploadResult>(
            (resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: "video-uploads",
                        resource_type: "video",
                        transformation: [
                            {quality:"auto", fetch_format : "mp4"}
                        ]
                     },
                    (error, result)=> {
                        if(error) reject(error)
                        else resolve (result as cloudinaryUploadResult)
                    }
                )
                UploadStream.end(buffer)
            }
        )

        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration:result.duration ||0,
            }
        })
        return NextResponse.json(video)
    } catch (error) {
        console.log("Upload video failed", error);
        return NextResponse.json ({error: "Upload video failed"},{status:500})
        
    } finally {
        await prisma.$disconnect()
    }
    }

