/**
 * app/index.js — the initial route matched by pinnest:///
 *
 * This screen is shown for a brief moment while _layout.js checks
 * the Supabase session and then calls router.replace() to send the
 * user either to /(tabs)/board (authenticated) or /auth (unauthenticated).
 *
 * It intentionally renders just the background color — the redirect
 * happens fast enough that the user should never see a spinner.
 */
import { View } from 'react-native';
import { WARM_BG } from '../src/constants/colors';

export default function Index() {
  return <View style={{ flex: 1, backgroundColor: WARM_BG }} />;
}
