import { Injectable, Logger } from '@nestjs/common';
import appConfig from 'src/config/app.config';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
    private client: Twilio.Twilio;
    // logger
    private readonly logger = new Logger(SmsService.name);
    constructor() {
        this.client = Twilio(
            appConfig().sms.sid,
            appConfig().sms.authToken,
        );
        this.logger.log('SmsService initialized');
    }

    async sendSms(to: string, message: string) {
            this.client.messages.create({
                to,
                from: appConfig().sms.from,
                body: message,
            });
    }
}
