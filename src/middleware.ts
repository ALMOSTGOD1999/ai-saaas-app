import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
    "/",
    "/home"
])

const isPublicApiRoute = createRouteMatcher([
    "/api/videos"

])

export default clerkMiddleware((auth, req) => {
  const {userId} =auth();
    const currentUrl = new URL(req.url)
    const isHomePage = currentUrl.pathname === "/home"
  const isApiRequest = currentUrl.pathname.startsWith("/api")

  //if user is logged in and accessing apublic route and not the dashboard
  
  if (userId && isPublicRoute(req) && !isHomePage) {
    return NextResponse.redirect(new URL("/home", req.url))
  }
  //not loged in
  if (!userId) {

    //if the user is not logged in and trying to access a protected route
    if (!isPublicRoute(req)! && isPublicApiRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
  
    }

    //if the request is for a protected api and the user is not logged in

    if (isApiRequest && !isPublicApiRoute(req)) {
     return NextResponse.redirect(new URL("/sign-in", req.url))  
    }
  }
  return NextResponse.next()
}
)



export const config = {
 matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}