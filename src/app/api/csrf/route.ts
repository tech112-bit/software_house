import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, validateCSRFToken } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    // Generate a new CSRF token
    const token = generateCSRFToken();
    
    // Set the token in a secure cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'CSRF token generated successfully' 
    });
    
    // Set the CSRF token cookie with secure settings
    response.cookies.set('csrf-token', token, {
      httpOnly: false, // Allow JavaScript access for frontend
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Get the stored token from cookies
    const storedToken = req.cookies.get('csrf-token')?.value;
    
    if (!storedToken) {
      return NextResponse.json(
        { success: false, message: 'No stored CSRF token found' },
        { status: 400 }
      );
    }
    
    // Validate the token
    const isValid = validateCSRFToken(token, storedToken);
    
    return NextResponse.json({
      success: true,
      isValid,
      message: isValid ? 'CSRF token is valid' : 'CSRF token is invalid'
    });
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to validate CSRF token' },
      { status: 500 }
    );
  }
}
