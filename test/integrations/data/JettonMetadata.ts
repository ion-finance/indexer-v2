const JettonMetadata: Record<
  string,
  {
    minter_address: string
    mintable: boolean
    total_supply: string
    metadata: {
      address: string
      name: string
      symbol: string
      decimals: string
      image: string
      description?: string
    }
    verification: string
    holders_count: number
  }
> = {
  EQDXPXpCRQScbFgRu_TXfAOHpKP6WmmOP1nICGq6ujaEKWsF: {
    minter_address: 'EQCIzrS1j1D7pBAmxysoXXvwL6OfbmBlqLlmUdSfte2fPqdJ',
    mintable: true,
    total_supply: '21000000000000000',
    metadata: {
      address:
        '0:88ceb4b58f50fba41026c72b285d7bf02fa39f6e6065a8b96651d49fb5ed9f3e',
      name: 'THANOS',
      symbol: 'THANOS',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/vUUtzIq3I756nbNBL58wYcz3RgU-PfLPzB8wFyB7OOQ/rs:fill:200:200:1/g:no/aHR0cHM6Ly90b24tdG9rZW5zLnMzLmFwLW5vcnRoZWFzdC0yLmFtYXpvbmF3cy5jb20vdGhhbm9zLnBuZw.webp',
      description: 'THANOS SNAP FINGER',
    },
    verification: 'none',
    holders_count: 5,
  },
  EQDpKrPWD9olggJI9NAEt2b9WOxUYuspoQRCia0kQyO6EayJ: {
    minter_address: 'EQCIIkXY1INUgkbA2P1Cvt3EGWaE0xmPn1gzw8QLxopSBPtS',
    mintable: true,
    total_supply: '1000000000',
    metadata: {
      address:
        '0:882245d8d483548246c0d8fd42beddc4196684d3198f9f5833c3c40bc68a5204',
      name: 'TON',
      symbol: 'SCAM',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/Hog4f0QWzlFp-aGWSDn3k9xhDyK4xrgjDmQXZTbRqLE/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvVHhPbmZEbDQ5VUpoTG5tYnlUaU9mSGtmY2NreGU4anJfUnVRYmV2dWNRay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5emRHRjBhV011YzNSdmJpNW1hUzlzYjJkdkwzUnZibDl6ZVcxaWIyd3VjRzVuLndlYnA.webp',
      description: 'Proxy contract for TON',
    },
    verification: 'blacklist',
    holders_count: 1,
  },
  EQD8T1PuqXqtApdsftklxztu_V_lnRFGMV4ZyFkWDF8CsdVX: {
    minter_address: 'EQC54miSZW6HoGRq6eb2lT0ciSYSWwfdFWVxvrjQwXgmzWpH',
    mintable: true,
    total_supply: '21000000000000000',
    metadata: {
      address:
        '0:b9e26892656e87a0646ae9e6f6953d1c8926125b07dd156571beb8d0c17826cd',
      name: 'Brrr',
      symbol: 'BRRR',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/xM87Q_Oinu_cdEck3u_WXdofl8eBA9Qlr5p27UYkALc/rs:fill:200:200:1/g:no/aHR0cHM6Ly90b24tdG9rZW5zLnMzLmFwLW5vcnRoZWFzdC0yLmFtYXpvbmF3cy5jb20vYnJycjIucG5n.webp',
      description: 'Fucking Money Printer',
    },
    verification: 'none',
    holders_count: 3,
  },
  'EQDXWP8l4GLJVjOIdp6AwLqvklmxa0rw19UNn5K-3_HDpmvy': {
    minter_address: 'EQDauk3DRKg3Gtfk7NrZVz1rrI-8WdYt3368iOZcyMi3mpwV',
    mintable: true,
    total_supply: '1000000000',
    metadata: {
      address:
        '0:daba4dc344a8371ad7e4ecdad9573d6bac8fbc59d62ddf7ebc88e65cc8c8b79a',
      name: 'Proxy TON',
      symbol: 'SCAM',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/Hog4f0QWzlFp-aGWSDn3k9xhDyK4xrgjDmQXZTbRqLE/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvVHhPbmZEbDQ5VUpoTG5tYnlUaU9mSGtmY2NreGU4anJfUnVRYmV2dWNRay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5emRHRjBhV011YzNSdmJpNW1hUzlzYjJkdkwzUnZibDl6ZVcxaWIyd3VjRzVuLndlYnA.webp',
      description: 'Proxy contract for TON',
    },
    verification: 'blacklist',
    holders_count: 9,
  },
  EQDs8G2rkKRlTXfoRxvdFcB2Xk4_UrLmwgvsJ_jiFvrAqT2A: {
    minter_address: 'EQAkcTVX6xKB6c2A9spAP765-W0bBHK12Y0NxQ0QnJ4J3F9z',
    mintable: true,
    total_supply: '10022000000000',
    metadata: {
      address:
        '0:24713557eb1281e9cd80f6ca403fbeb9f96d1b0472b5d98d0dc50d109c9e09dc',
      name: 'ION testnet',
      symbol: 'ION',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/__HXNgqLtvTzTNuZuH58CEL5GAeVNvoy68dTS8n3Bdk/rs:fill:200:200:1/g:no/aHR0cHM6Ly9naXRodWIuY29tL2lvbi1maW5hbmNlL2RvY3MvYmxvYi9tYWluLy5naXRib29rL2Fzc2V0cy8yNTAlMjBiLnBuZz9yYXc9dHJ1ZQ.webp',
      description: 'Testnet ION Token',
    },
    verification: 'none',
    holders_count: 1071,
  },
  EQBVtkCFnA6yEKwAFHvwGkzMHtfxioWgRsdfhpgBlWtuz6NG: {
    minter_address: 'EQDbhnBo4vpv7O_sOgRGdOVp1t4eVNQR2NiVJPBqYmBvZAfr',
    mintable: true,
    total_supply: '21000000000000000',
    metadata: {
      address:
        '0:db867068e2fa6fecefec3a044674e569d6de1e54d411d8d89524f06a62606f64',
      name: 'Qucak2 Coin',
      symbol: 'QUC2',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/8r46Ah61KlpIbFKCHtyMCqwe8QfPhwM8XFCjGIsgEIU/rs:fill:200:200:1/g:no/aHR0cHM6Ly9pbWFnZXMucGV4ZWxzLmNvbS9waG90b3MvODA1OTIyL3BleGVscy1waG90by04MDU5MjIuanBlZz9hdXRvPWNvbXByZXNzJmNzPXRpbnlzcmdiJnc9MTI2MCZoPTc1MCZkcHI9Mg.webp',
      description:
        'Low fee peer-to-peer electronic cash alternative to Bitcoin',
    },
    verification: 'none',
    holders_count: 4,
  },
  EQD7dnlGxnGJ8TLycKnocPQXU1ipUaXCY0fYiic9hD_O6RAC: {
    minter_address: 'EQBUbdSVn8l2Efe-AeiFW0-E_hOG9SWZgRUACaxZAf3uwv1e',
    mintable: true,
    total_supply: '100000000000000',
    metadata: {
      address:
        '0:546dd4959fc97611f7be01e8855b4f84fe1386f5259981150009ac5901fdeec2',
      name: 'TESTToken',
      symbol: 'TESTToken',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/cOMlJuViiVXDCkAghnyNj7plX8pAZ9pv3WhklvebpTY/rs:fill:200:200:1/g:no/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3RvbmtlZXBlci9vcGVudG9uYXBpL21hc3Rlci9wa2cvcmVmZXJlbmNlcy9tZWRpYS90b2tlbl9wbGFjZWhvbGRlci5wbmc.webp',
    },
    verification: 'none',
    holders_count: 3,
  },
  'EQDJHdS-w9CCllpU6kOAUzZrhS86mKcImCdfuqcF-r1nN5zU': {
    minter_address: 'EQBXkj37K2KP7i2GFNwEE_-z-yNZJfNTEhsYq2q9RDnIfjfL',
    mintable: true,
    total_supply: '1000000000',
    metadata: {
      address:
        '0:57923dfb2b628fee2d8614dc0413ffb3fb235925f353121b18ab6abd4439c87e',
      name: 'TON',
      symbol: 'SCAM',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/Hog4f0QWzlFp-aGWSDn3k9xhDyK4xrgjDmQXZTbRqLE/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvVHhPbmZEbDQ5VUpoTG5tYnlUaU9mSGtmY2NreGU4anJfUnVRYmV2dWNRay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5emRHRjBhV011YzNSdmJpNW1hUzlzYjJkdkwzUnZibDl6ZVcxaWIyd3VjRzVuLndlYnA.webp',
      description: 'Proxy contract for TON',
    },
    verification: 'blacklist',
    holders_count: 1,
  },
  EQAbjh1DcHBW94MRNZkzEG7U1iClueDlwPP4zcSwqXqMSyz4: {
    minter_address: 'EQCPDZOHyAC_l24eIRy1GaHc1JdWz_0VWiIstmY-uJgmhd42',
    mintable: true,
    total_supply: '300000000000',
    metadata: {
      address:
        '0:8f0d9387c800bf976e1e211cb519a1dcd49756cffd155a222cb6663eb8982685',
      name: 'ION testnet',
      symbol: 'ION',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/__HXNgqLtvTzTNuZuH58CEL5GAeVNvoy68dTS8n3Bdk/rs:fill:200:200:1/g:no/aHR0cHM6Ly9naXRodWIuY29tL2lvbi1maW5hbmNlL2RvY3MvYmxvYi9tYWluLy5naXRib29rL2Fzc2V0cy8yNTAlMjBiLnBuZz9yYXc9dHJ1ZQ.webp',
      description: 'Testnet ION Token',
    },
    verification: 'none',
    holders_count: 5,
  },
  EQCKL8G2zFP_0OsvJn_UzzlpcN9VT8VmdFCDdQP6yIoo4sy5: {
    minter_address: 'EQB6C12QvuqVWFBTyMkYwRfk-dlZD3JFRdXJm6MIXC12AYwS',
    mintable: true,
    total_supply: '100000000000000',
    metadata: {
      address:
        '0:7a0b5d90beea95585053c8c918c117e4f9d9590f724545d5c99ba3085c2d7601',
      name: 'devT',
      symbol: 'devT',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/cOMlJuViiVXDCkAghnyNj7plX8pAZ9pv3WhklvebpTY/rs:fill:200:200:1/g:no/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3RvbmtlZXBlci9vcGVudG9uYXBpL21hc3Rlci9wa2cvcmVmZXJlbmNlcy9tZWRpYS90b2tlbl9wbGFjZWhvbGRlci5wbmc.webp',
    },
    verification: 'none',
    holders_count: 2,
  },
  'EQAVcaJkUMkCt1PKo0vTc-OLXkbSnG1KfRfxEiZUi3DKAtI8': {
    minter_address: 'EQDEzad_82DuAUgeODmtU4x7KAKCBzqOWS-VrplUNCRVX58U',
    mintable: true,
    total_supply: '100000000000000',
    metadata: {
      address:
        '0:c4cda77ff360ee01481e3839ad538c7b280282073a8e592f95ae99543424555f',
      name: 'abc',
      symbol: 'abc',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/cOMlJuViiVXDCkAghnyNj7plX8pAZ9pv3WhklvebpTY/rs:fill:200:200:1/g:no/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3RvbmtlZXBlci9vcGVudG9uYXBpL21hc3Rlci9wa2cvcmVmZXJlbmNlcy9tZWRpYS90b2tlbl9wbGFjZWhvbGRlci5wbmc.webp',
    },
    verification: 'none',
    holders_count: 3,
  },
  EQDLsnPPc0wJ5ItoDA0bQQ6I3uhENlcxOG76Q4gM_nOzYKog: {
    minter_address: 'EQCXVU5cfKhcpqEWefdkBxzQo4he62F5AboZ7dYc6MgzZQ00',
    mintable: true,
    total_supply: '100000000000000',
    metadata: {
      address:
        '0:97554e5c7ca85ca6a11679f764071cd0a3885eeb617901ba19edd61ce8c83365',
      name: 'txTEST',
      symbol: 'txTEST',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/cOMlJuViiVXDCkAghnyNj7plX8pAZ9pv3WhklvebpTY/rs:fill:200:200:1/g:no/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3RvbmtlZXBlci9vcGVudG9uYXBpL21hc3Rlci9wa2cvcmVmZXJlbmNlcy9tZWRpYS90b2tlbl9wbGFjZWhvbGRlci5wbmc.webp',
    },
    verification: 'none',
    holders_count: 2,
  },
  'EQAJbVJ_pl0r8_VRv_Jj-mkzgATod13m5wAA3k4oeBZfFZ5': {
    minter_address: 'EQDZ4ygzEuYXIyHLj4rW5t7WEplBu21SCSSwYTEW1DL5Ewnh',
    mintable: true,
    total_supply: '100000000000000',
    metadata: {
      address:
        '0:d9e3283312e6172321cb8f8ad6e6ded6129941bb6d520924b0613116d432f913',
      name: 'TESTZ',
      symbol: 'TESTZ',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/cOMlJuViiVXDCkAghnyNj7plX8pAZ9pv3WhklvebpTY/rs:fill:200:200:1/g:no/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3RvbmtlZXBlci9vcGVudG9uYXBpL21hc3Rlci9wa2cvcmVmZXJlbmNlcy9tZWRpYS90b2tlbl9wbGFjZWhvbGRlci5wbmc.webp',
    },
    verification: 'none',
    holders_count: 3,
  },
  'EQAJbVJ_pl0r8_VRv_Jj-mkzgATod13m5wAA3k4oeBZfFZ5c': {
    minter_address: 'EQDZ4ygzEuYXIyHLj4rW5t7WEplBu21SCSSwYTEW1DL5Ewnh',
    mintable: true,
    total_supply: '100000000000000',
    metadata: {
      address:
        '0:d9e3283312e6172321cb8f8ad6e6ded6129941bb6d520924b0613116d432f913',
      name: 'TESTZ',
      symbol: 'TESTZ',
      decimals: '9',
      image:
        'https://cache.tonapi.io/imgproxy/cOMlJuViiVXDCkAghnyNj7plX8pAZ9pv3WhklvebpTY/rs:fill:200:200:1/g:no/aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3RvbmtlZXBlci9vcGVudG9uYXBpL21hc3Rlci9wa2cvcmVmZXJlbmNlcy9tZWRpYS90b2tlbl9wbGFjZWhvbGRlci5wbmc.webp',
    },
    verification: 'none',
    holders_count: 3,
  },
}

export default JettonMetadata
