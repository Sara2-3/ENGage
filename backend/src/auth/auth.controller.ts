import { Body, Controller, Get, HttpCode, Post, UnauthorizedException } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LoginDto } from "./DTO/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Fills the form from the role buttons under the sign-in.
  @Get("demo")
  public async demo() {
    return this.auth.demo();
  }

  @Post("login")
  @HttpCode(200)
  public async login(@Body() body: LoginDto) {
    const user = this.auth.login(body?.username, body?.password);
    // The same answer for a wrong name and a wrong password.
    if (!user) throw new UnauthorizedException("Wrong username or password.");
    return user;
  }
}
