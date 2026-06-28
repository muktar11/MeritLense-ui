import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
 
export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [
    common,
    admin_companies
  ] = await Promise.all([
    import(`@/../messages/${locale}/common.json`),
    import(`@/../messages/${locale}/admin_companies.json`),
  ]);
 
  return {
    messages: {
      ...common.default,
      ...admin_companies.default
    },
    locale
  };
});