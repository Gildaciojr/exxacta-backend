import { Body, Controller, Post } from "@nestjs/common";
import { ImportApifyByUrlDto } from "./dto/import-by-url.dto";
import { ApifyImportService } from "./apify-import.service";

@Controller("/api/apify")
export class ApifyController {
  constructor(private readonly service: ApifyImportService) {}

  @Post("/import-by-url")
  async importByUrl(@Body() body: ImportApifyByUrlDto) {
    return this.service.importByUrl(body.url, body.forceImport);
  }
}
