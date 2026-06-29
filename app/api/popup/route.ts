import { NextResponse } from "next/server";
import Popup from "@/models/Popup";
import Offer from "@/models/Offer";
import dbConnect from "@/lib/mongodb";

export async function GET() {
    try {
        await dbConnect();
        
        // 1. Check for latest active Offer
        const latestOffer = await Offer.findOne({ isActive: true }).sort({ createdAt: -1 });
        
        if (latestOffer) {
            return NextResponse.json({ 
                success: true, 
                popup: {
                    title: latestOffer.title,
                    titleBn: latestOffer.titleBn,
                    description: latestOffer.description,
                    descriptionBn: latestOffer.descriptionBn,
                    imageUrl: latestOffer.imageUrl,
                    buttonText: 'Learn More',
                    buttonTextBn: 'আরও জানুন',
                    buttonLink: '/offers',
                    isActive: latestOffer.isActive
                } 
            });
        }

        // 2. Fallback to manual Popup
        let popup = await Popup.findOne().sort({ updatedAt: -1 });

        if (!popup) {
             return NextResponse.json({ success: true, popup: null });
        }

        return NextResponse.json({ success: true, popup });
    } catch (error) {
        console.error("Error fetching popup:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch popup" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const data = await request.json();

        let popup = await Popup.findOne();

        if (popup) {
            popup.title = data.title;
            popup.titleBn = data.titleBn;
            popup.description = data.description;
            popup.descriptionBn = data.descriptionBn;
            popup.imageUrl = data.imageUrl;
            popup.buttonText = data.buttonText;
            popup.buttonTextBn = data.buttonTextBn;
            popup.buttonLink = data.buttonLink;
            popup.isActive = data.isActive;
            await popup.save();
        } else {
            popup = await Popup.create(data);
        }

        return NextResponse.json({ success: true, popup });
    } catch (error) {
        console.error("Error saving popup:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save popup" },
            { status: 500 }
        );
    }
}
