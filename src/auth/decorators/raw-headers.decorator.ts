import { createParamDecorator } from "@nestjs/common";

export const RawHeaders = createParamDecorator(
    (data, ctx) => {
        const req = ctx.switchToHttp().getRequest();
        return req.rawHeaders;
    }
)