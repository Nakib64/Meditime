import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout successful" },
    { status: 200 }
  );

  // Clear the admin cookies
  response.cookies.set('admin_access_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  response.cookies.set('admin_refresh_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  response.cookies.set('admin_temp_otp', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
