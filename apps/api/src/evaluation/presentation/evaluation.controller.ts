import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { EvaluationService } from '../application/evaluation.service';
import type { EvaluationContextRequest, EvaluationRequest, EvaluationResponse } from '@fp/shared';

@Controller('evaluate')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @HttpCode(200)
  async evaluate(@Body() body: EvaluationRequest): Promise<EvaluationResponse> {
    const enabled = await this.evaluationService.evaluate(body.flag);
    return { enabled };
  }

  @Post('context')
  @HttpCode(200)
  async evaluateWithContext(@Body() body: EvaluationContextRequest): Promise<EvaluationResponse> {
    const enabled = await this.evaluationService.evaluateWithContext(body.flag, body.userId);
    return { enabled };
  }
}
