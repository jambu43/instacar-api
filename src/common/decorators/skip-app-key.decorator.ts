import { SetMetadata } from '@nestjs/common';

export const SKIP_APP_KEY = 'skipAppKeyCheck';
export const SkipAppKey = () => SetMetadata(SKIP_APP_KEY, true);
