import { Module } from '@nestjs/common';
import { AiController } from '../controllers/ai.controller';
import { AiService } from '../services/ai.service';
import { GitHubService } from '../services/github.service';

@Module({
  controllers: [AiController],
  providers: [AiService, GitHubService],
  exports: [AiService, GitHubService],
})
export class AiModule {}
