import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
 
export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const common = await import(`@/../messages/${locale}/common.json`);
  const legal = await import(`@/../messages/${locale}/legal.json`);

  return {
    messages: {
      ...common.default,
      ...legal.default
    },
    locale
  };
});