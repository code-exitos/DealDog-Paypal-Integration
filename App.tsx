/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  useColorScheme,
  View,
  Modal,
  TextInput,
} from 'react-native';
import Button from './src/Components/Button';
// import Clipboard from '@react-native-clipboard/clipboard';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
import paypalApi from './src/apis/paypalApi';
import WebView, {WebViewNavigation} from 'react-native-webview';
import queryString from 'query-string';
import Toast from 'react-native-simple-toast';

function App(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerUrl, setPartnerUrl] = useState<string | null>(null);

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const handleClick = async () => {
    console.log('click');
    try {
      setLoading(true);
      const token = await paypalApi.generateToken();
      const res = await paypalApi.createOrder({
        token,
        sellerPayerId: partnerId || '',
      });
      setAccessToken(token);
      console.log('response', res);

      if (res?.links?.length) {
        const url = res.links.find(item => item.rel === 'approve');
        if (url?.href) {
          setPaypalUrl(url.href);
        } else {
          Toast.show('Error on payment, no url found', Toast.SHORT, {
            backgroundColor: '#d16564',
            textColor: 'white',
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleClickPartner = async () => {
    console.log('click');
    try {
      setLoading(true);
      const token = await paypalApi.generateToken();
      const res = await paypalApi.addPartner({token});
      setAccessToken(token);
      console.log('add partner', res);

      if (res?.links?.length) {
        const url = res.links.find(item => item.rel === 'action_url');
        const _self = res.links.find(item => item.rel === 'self');
        if (url?.href) {
          setPartnerUrl(url.href);
          console.log('partner url', url.href);
        }
        if (_self?.href) {
          const splitedUrl = _self.href.split('/');
          const partId = splitedUrl[splitedUrl.length - 1];
          console.log('self', _self.href);
          console.log('partner id', partId);
          setPartnerId(partId);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const onUrlChange = (webViewState: WebViewNavigation) => {
    console.log('web view state', webViewState);
    if (webViewState.url.includes('https://example.com/cancel')) {
      clearPaypalState();
      Toast.show('Cancelled payment', Toast.SHORT, {
        backgroundColor: '#d16564',
        textColor: 'white',
      });
      return;
    }
    if (webViewState.url.includes('https://example.com/return')) {
      const urlValues = queryString.parseUrl(webViewState.url);
      console.log('url values', urlValues);
      const {token} = urlValues.query;
      if (token) {
        paymentSucess(token as string);
      }
    }
  };

  const paymentSucess = async (id: string) => {
    try {
      if (accessToken) {
        const res = paypalApi.capturePayment({
          id,
          token: accessToken,
          sellerPayerId: partnerId || '',
        });
        console.log('payment resp', res);
        clearPaypalState();
        Toast.show('Payment Successfull!', Toast.LONG);
      }
    } catch (e) {
      Toast.show('Error on payment', Toast.SHORT, {
        backgroundColor: '#d16564',
        textColor: 'white',
      });
    }
  };

  const clearPaypalState = () => {
    setPaypalUrl(null);
    setAccessToken(null);
    setLoading(false);
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Button
            text="Add Partner"
            btnStyle={{backgroundColor: '#009435', margin: 16}}
            isLoading={loading}
            onPress={() => {
              handleClickPartner();
            }}
          />
          <Button
            text="Paypal"
            disabled={!partnerId}
            btnStyle={{backgroundColor: '#0f4fa3', margin: 16}}
            isLoading={loading}
            onPress={() => {
              handleClick();
            }}
          />

          <Modal visible={!!paypalUrl}>
            <View style={{flex: 1}}>
              {paypalUrl && (
                <WebView
                  source={{uri: paypalUrl}}
                  onNavigationStateChange={onUrlChange}
                />
              )}
            </View>
          </Modal>
          <Modal visible={!!partnerUrl}>
            <View>
              <TextInput>Url To send: {partnerUrl}</TextInput>
              {/* <Button
                text="Copy url"
                onPress={() => {
                  Clipboard.setString(partnerUrl || '');
                }}
              /> */}
              <Button
                text="Close"
                onPress={() => {
                  setPartnerUrl(null);
                }}
              />
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
