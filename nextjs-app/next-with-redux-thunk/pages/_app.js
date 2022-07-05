import { Provider } from 'react-redux'
import SSRProvider from 'react-bootstrap/SSRProvider';

import { useStore } from '../store'
import Layout from '../components/layout'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import '../styles/index.scss'

export default function App({ Component, pageProps }) {
  const store = useStore(pageProps.initialReduxState)

  return (
    <SSRProvider>
      <Provider store={store}>
        <Layout>
          <Navbar />
          <Component {...pageProps} />
          <Footer />
        </Layout>
      </Provider>
    </SSRProvider>
  )
}
