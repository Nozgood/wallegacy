// use client indicates the server to render this component in the front side, it is very weird in my opinion
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { hardhat, sepolia } from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'Wallegacy DApp',
  projectId: 'cd5e882efd372f6cba03a79d5145c099', // it seems not to be essential but we set it https://dashboard.reown.com/da31fbe9-3e1a-48a4-becb-3904ae766a7c/66a6c27a-fe93-4bc0-b645-ad36920daff8
  chains: [sepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const RainbowKitAndWagmi = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default RainbowKitAndWagmi;