import { NextRequest, NextResponse } from "next/server";

// TODO: make the token more complex and decode it to authenticate correctly the user
function proxy(req: NextRequest) {
    console.log("notary middleware executing")
    const token = req.cookies.get("notary_token")?.value
   
    if (req.nextUrl.pathname.startsWith("/notary/login") && token) {
        return NextResponse.redirect(new URL("/notary/space", req.url))
    }
    


    // redirect user on notary login page if no token registered
    if (req.nextUrl.pathname.startsWith("/notary/space") && !token) {
        return NextResponse.redirect(new URL("/notary/login", req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/notary/:path*'
}

export default proxy;