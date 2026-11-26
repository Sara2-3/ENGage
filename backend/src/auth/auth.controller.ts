import { Body, Controller, Get, HttpCode, Post, UnauthorizedException } from "@nestjs/common";

import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Fills the form from the role buttons under the sign-in.
  @Get("demo")
  demo() {
    return this.auth.demo();
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() body: { username?: unknown; password?: unknown }) {
    const user = this.auth.login(body?.username, body?.password);
    // The same answer for a wrong name and a wrong password.
    if (!user) throw new UnauthorizedException("Wrong username or password.");
    return user;
  }
}
