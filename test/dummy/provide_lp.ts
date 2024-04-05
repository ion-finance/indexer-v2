// testnet, ion-stonfi
// provide lp 1/2  send 1 ION
export const provideLp1 = {
  event_id: '4aca79a22e05bd111dff2bd22866886927f41d1f4226b468426ecaebc6abedf4',
  account: {
    address:
      '0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156',
    is_scam: false,
    is_wallet: false,
  },
  timestamp: 1711358949,
  actions: [
    {
      type: 'JettonTransfer',
      status: 'ok',
      JettonTransfer: {
        sender: {
          address:
            '0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b',
          is_scam: false,
          is_wallet: true,
        },
        recipient: {
          address:
            '0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156',
          is_scam: false,
          is_wallet: false,
        },
        senders_wallet:
          '0:80a52a5929867c2ebe209030a819a7a832dc926dede7de15e51d9ab360037fe6',
        recipients_wallet:
          '0:1fe3be85795a99453a7ff2fc9b9518d7aca80da1ebd666145f19615429c21d6f',
        amount: '1000000000',
        comment: 'Call: StonfiProvideLiquidity',
        jetton: {
          address:
            '0:8f0d9387c800bf976e1e211cb519a1dcd49756cffd155a222cb6663eb8982685',
          name: 'ION testnet',
          symbol: 'ION',
          decimals: 9,
          image:
            'https://cache.tonapi.io/imgproxy/__HXNgqLtvTzTNuZuH58CEL5GAeVNvoy68dTS8n3Bdk/rs:fill:200:200:1/g:no/aHR0cHM6Ly9naXRodWIuY29tL2lvbi1maW5hbmNlL2RvY3MvYmxvYi9tYWluLy5naXRib29rL2Fzc2V0cy8yNTAlMjBiLnBuZz9yYXc9dHJ1ZQ.webp',
          verification: 'none',
        },
      },
      simple_preview: {
        name: 'Jetton Transfer',
        description: 'Transferring 1 ION testnet',
        value: '1 ION testnet',
        value_image:
          'https://cache.tonapi.io/imgproxy/__HXNgqLtvTzTNuZuH58CEL5GAeVNvoy68dTS8n3Bdk/rs:fill:200:200:1/g:no/aHR0cHM6Ly9naXRodWIuY29tL2lvbi1maW5hbmNlL2RvY3MvYmxvYi9tYWluLy5naXRib29rL2Fzc2V0cy8yNTAlMjBiLnBuZz9yYXc9dHJ1ZQ.webp',
        accounts: [
          {
            address:
              '0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b',
            is_scam: false,
            is_wallet: true,
          },
          {
            address:
              '0:8f0d9387c800bf976e1e211cb519a1dcd49756cffd155a222cb6663eb8982685',
            is_scam: false,
            is_wallet: false,
          },
        ],
      },
    },
    {
      type: 'SmartContractExec',
      status: 'ok',
      SmartContractExec: {
        executor: {
          address:
            '0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156',
          is_scam: false,
          is_wallet: false,
        },
        contract: {
          address:
            '0:6b0d5bc68ca07ac6aac513e62e0be1407083319e46abf5d4c969ec8e9f2a83b8',
          is_scam: false,
          is_wallet: false,
        },
        ton_attached: 234785000,
        operation: '0xfcf9e58f',
      },
      simple_preview: {
        name: 'Smart Contract Execution',
        description: 'Execution of smart contract',
        accounts: [
          {
            address:
              '0:6b0d5bc68ca07ac6aac513e62e0be1407083319e46abf5d4c969ec8e9f2a83b8',
            is_scam: false,
            is_wallet: false,
          },
        ],
      },
    },
  ],
  is_scam: false,
  lt: 20219802000001,
  in_progress: false,
  extra: 234328051,
}
// provide lp 2/2 0.2 TON
export const provideLp2 = {
  event_id: '66d1f0b105eca2e7f0244b01029daff8ef3a2f37b6ba041ef328ed05b73c308f',
  account: {
    address:
      '0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156',
    is_scam: false,
    is_wallet: false,
  },
  timestamp: 1711359480,
  actions: [
    {
      type: 'JettonTransfer',
      status: 'ok',
      JettonTransfer: {
        sender: {
          address:
            '0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b',
          is_scam: false,
          is_wallet: true,
        },
        recipient: {
          address:
            '0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156',
          is_scam: false,
          is_wallet: false,
        },
        senders_wallet:
          '0:af4c47787b8473641e7ea831a2c4d7aa831f78d2908df04562bafeb42461fb80',
        recipients_wallet:
          '0:0000000000000000000000000000000000000000000000000000000000000000',
        amount: '200000000',
        comment: 'Call: StonfiProvideLiquidity',
        jetton: {
          address:
            '0:882245d8d483548246c0d8fd42beddc4196684d3198f9f5833c3c40bc68a5204',
          name: 'TON',
          symbol: 'SCAM',
          decimals: 9,
          image:
            'https://cache.tonapi.io/imgproxy/Hog4f0QWzlFp-aGWSDn3k9xhDyK4xrgjDmQXZTbRqLE/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvVHhPbmZEbDQ5VUpoTG5tYnlUaU9mSGtmY2NreGU4anJfUnVRYmV2dWNRay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5emRHRjBhV011YzNSdmJpNW1hUzlzYjJkdkwzUnZibDl6ZVcxaWIyd3VjRzVuLndlYnA.webp',
          verification: 'blacklist',
        },
      },
      simple_preview: {
        name: 'Jetton Transfer',
        description: 'Transferring 0.2 TON',
        value: '0.2 TON',
        value_image:
          'https://cache.tonapi.io/imgproxy/Hog4f0QWzlFp-aGWSDn3k9xhDyK4xrgjDmQXZTbRqLE/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvVHhPbmZEbDQ5VUpoTG5tYnlUaU9mSGtmY2NreGU4anJfUnVRYmV2dWNRay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5emRHRjBhV011YzNSdmJpNW1hUzlzYjJkdkwzUnZibDl6ZVcxaWIyd3VjRzVuLndlYnA.webp',
        accounts: [
          {
            address:
              '0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b',
            is_scam: false,
            is_wallet: true,
          },
          {
            address:
              '0:882245d8d483548246c0d8fd42beddc4196684d3198f9f5833c3c40bc68a5204',
            is_scam: false,
            is_wallet: false,
          },
        ],
      },
    },
    {
      type: 'SmartContractExec',
      status: 'ok',
      SmartContractExec: {
        executor: {
          address:
            '0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156',
          is_scam: false,
          is_wallet: false,
        },
        contract: {
          address:
            '0:6b0d5bc68ca07ac6aac513e62e0be1407083319e46abf5d4c969ec8e9f2a83b8',
          is_scam: false,
          is_wallet: false,
        },
        ton_attached: 234811000,
        operation: '0xfcf9e58f',
      },
      simple_preview: {
        name: 'Smart Contract Execution',
        description: 'Execution of smart contract',
        accounts: [
          {
            address:
              '0:6b0d5bc68ca07ac6aac513e62e0be1407083319e46abf5d4c969ec8e9f2a83b8',
            is_scam: false,
            is_wallet: false,
          },
        ],
      },
    },
  ],
  is_scam: false,
  lt: 20219980000001,
  in_progress: false,
  extra: 34810071,
}

const provideLpTotal = {}
