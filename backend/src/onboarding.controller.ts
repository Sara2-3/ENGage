import { Controller, Get, Param } from "@nestjs/common";

import { OnboardingCase, OnboardingService } from "./onboarding.service";

@Controller("onboarding/cases")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get(":caseId")
  getCase(@Param("caseId") caseId: string): Promise<OnboardingCase> {
    return this.onboardingService.getCase(caseId);
  }
}
