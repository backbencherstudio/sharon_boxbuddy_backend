import { SetMetadata } from '@nestjs/common'; // Key to mark the route as public
export const PUBLIC_KEY = 'isPublic'; // Custom decorator to make a route public
export const Public = () => SetMetadata(PUBLIC_KEY, true);
