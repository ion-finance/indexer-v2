//  swap TON -> ION
export const TONtoION = [
  {
    event_id:
      "9615a816495834ca1adad20a271bf6265dc857dab4bdb7bc7c42cc169a231e2c",
    account: {
      address:
        "0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156",
      is_scam: false,
      is_wallet: false,
    },
    timestamp: 1711105103,
    actions: [
      {
        type: "JettonSwap",
        status: "failed",
        JettonSwap: {
          dex: "stonfi",
          amount_in: "",
          amount_out: "1000000000",
          ton_in: 100000000,
          user_wallet: {
            address:
              "0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b",
            is_scam: false,
            is_wallet: true,
          },
          router: {
            address:
              "0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156",
            is_scam: false,
            is_wallet: false,
          },
          jetton_master_out: {
            address:
              "0:8f0d9387c800bf976e1e211cb519a1dcd49756cffd155a222cb6663eb8982685",
            name: "ION testnet",
            symbol: "ION",
            decimals: 9,
            image:
              "https://cache.tonapi.io/imgproxy/__HXNgqLtvTzTNuZuH58CEL5GAeVNvoy68dTS8n3Bdk/rs:fill:200:200:1/g:no/aHR0cHM6Ly9naXRodWIuY29tL2lvbi1maW5hbmNlL2RvY3MvYmxvYi9tYWluLy5naXRib29rL2Fzc2V0cy8yNTAlMjBiLnBuZz9yYXc9dHJ1ZQ.webp",
            verification: "none",
          },
        },
        simple_preview: {
          name: "Swap Tokens",
          description: "Swapping 0.1 TON  for 1 ION",
          accounts: [
            {
              address:
                "0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b",
              is_scam: false,
              is_wallet: true,
            },
          ],
        },
      },
    ],
    is_scam: false,
    lt: 20137892000001,
    in_progress: false,
    extra: -974,
  },
];

export const IONtoTON = [
  {
    event_id:
      "b77baf9b341f2aa7e6019b94fa2d59876ec021b095cb93146e0cfd263ce95e20",
    account: {
      address:
        "0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156",
      is_scam: false,
      is_wallet: false,
    },
    timestamp: 1711104555,
    actions: [
      {
        type: "JettonSwap",
        status: "ok",
        JettonSwap: {
          dex: "stonfi",
          amount_in: "100000000",
          amount_out: "",
          ton_out: 18130605,
          user_wallet: {
            address:
              "0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b",
            is_scam: false,
            is_wallet: true,
          },
          router: {
            address:
              "0:60ce3b388301b99a5263f23a0f1604d03344b8f4dda5bb00e9fe3860b17da156",
            is_scam: false,
            is_wallet: false,
          },
          jetton_master_in: {
            address:
              "0:8f0d9387c800bf976e1e211cb519a1dcd49756cffd155a222cb6663eb8982685",
            name: "ION testnet",
            symbol: "ION",
            decimals: 9,
            image:
              "https://cache.tonapi.io/imgproxy/__HXNgqLtvTzTNuZuH58CEL5GAeVNvoy68dTS8n3Bdk/rs:fill:200:200:1/g:no/aHR0cHM6Ly9naXRodWIuY29tL2lvbi1maW5hbmNlL2RvY3MvYmxvYi9tYWluLy5naXRib29rL2Fzc2V0cy8yNTAlMjBiLnBuZz9yYXc9dHJ1ZQ.webp",
            verification: "none",
          },
        },
        simple_preview: {
          name: "Swap Tokens",
          description: "Swapping 0.1 ION for 0.018130605 TON ",
          accounts: [
            {
              address:
                "0:f74289dc10dc92be13c1cccfdac473e5e654681f6c5d42a3cdb3cd60a2032b0b",
              is_scam: false,
              is_wallet: true,
            },
          ],
        },
      },
    ],
    is_scam: false,
    lt: 20137704000001,
    in_progress: false,
    extra: -303,
  },
];
