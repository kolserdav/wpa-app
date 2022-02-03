import type { NextPage } from 'next';
import axios from 'axios';
import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';

const Home: NextPage = () => {
  useEffect(() => {
    (async () => {
      const res = await axios.request({
        method: 'GET',
        url: '/api/users/findFirst',
      });
      console.log(res?.data);
    })();
  }, []);
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </div>
  );
};

export default Home;
