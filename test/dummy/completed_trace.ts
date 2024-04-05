export const ts = {
  transaction: {
    hash: '3e7802d76c1b081990831354a279c3f0d22de96560d888e76b248ac79d795d23',
    lt: 20515354000001,
    account: {
      address:
        '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
      is_scam: false,
      is_wallet: true,
    },
    success: true,
    utime: 1712306018,
    orig_status: 'active',
    end_status: 'active',
    total_fees: 7289506,
    transaction_type: 'TransOrd',
    state_update_old:
      '6f2104597576720cb6a4a39c07a1932c1d60ba46abe7f911ed05946fd509c161',
    state_update_new:
      '7536638860d084e5dd7cffe5a55d39fa51a57e89449b45279fff6f2a647ababd',
    in_msg: {
      msg_type: 'ext_in_msg',
      created_lt: 20515354000001,
      ihr_disabled: false,
      bounce: false,
      bounced: false,
      value: 0,
      fwd_fee: 0,
      ihr_fee: 0,
      destination: {
        address:
          '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
        is_scam: false,
        is_wallet: true,
      },
      import_fee: 0,
      created_at: 0,
      raw_body:
        'b5ee9c720102050100013300019ce9f6c07259a1a346ad233625bcfa5f453a450fba230fed918d8b4ee88b7d6d295ea0dd95533b18d7855eba96f314b32fbda9954e79bdb4dfbd6a51eda7958b0c29a9a317660fb88b000002880003010168620031899ee0264ac253656f3015f11786c0d86a2f77e5ca05dd1293c88f373588f9a0bebc2000000000000000000000000000010202b40f8a7ea50000000000000000609184e72a0008016eee66c8b147f85d6b9d97a378a17478b6b16ba93a3c2e8fff84d24d6ec760f9003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b5096823c346010304000000915b1234b8801aeb1fe4bc0c592ac6710ed3d0181755f24b362d695e1afaa1b3f257dbfe3874c203003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b50950',
    },
    out_msgs: [],
    block: '(0,e000000000000000,19607783)',
    prev_trans_hash:
      'e03849095d43b794aa5e7ef51ab289f7e595bcf3bcc49f16e8a942e8d0e4d1db',
    prev_trans_lt: 20515114000001,
    compute_phase: {
      skipped: false,
      success: true,
      gas_fees: 3308000,
      gas_used: 3308,
      vm_steps: 68,
      exit_code: 0,
    },
    storage_phase: {
      fees_collected: 186,
      status_change: 'acst_unchanged',
    },
    action_phase: {
      success: true,
      result_code: 0,
      total_actions: 1,
      skipped_actions: 0,
      fwd_fees: 2599000,
      total_fees: 866320,
    },
    aborted: false,
    destroyed: false,
  },
  interfaces: ['wallet_v4r2'],
  children: [
    {
      transaction: {
        hash: '9ea5910a1d294f41c31730a6f16ca660bc72afa1db1a7dcadd57419ba133a051',
        lt: 20515357000001,
        account: {
          address:
            '0:63133dc04c9584a6cade602be22f0d81b0d45eefcb940bba2527911e6e6b11f3',
          is_scam: false,
          is_wallet: false,
        },
        success: true,
        utime: 1712306028,
        orig_status: 'active',
        end_status: 'active',
        total_fees: 12343674,
        transaction_type: 'TransOrd',
        state_update_old:
          'd27d37bde5f4f73a2e7b50ac63ef24b66d7efe71c2ded7a604a4b646f29936d3',
        state_update_new:
          'c80daddc8b7f23e6c13612b9da041d6d9e8c02575927ad358190db0eb928910f',
        in_msg: {
          msg_type: 'int_msg',
          created_lt: 20515354000002,
          ihr_disabled: true,
          bounce: true,
          bounced: false,
          value: 400000000,
          fwd_fee: 1732680,
          ihr_fee: 0,
          destination: {
            address:
              '0:63133dc04c9584a6cade602be22f0d81b0d45eefcb940bba2527911e6e6b11f3',
            is_scam: false,
            is_wallet: false,
          },
          source: {
            address:
              '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
            is_scam: false,
            is_wallet: true,
          },
          import_fee: 0,
          created_at: 1712306018,
          op_code: '0x0f8a7ea5',
          raw_body:
            'b5ee9c720101030100ab0002b40f8a7ea50000000000000000609184e72a0008016eee66c8b147f85d6b9d97a378a17478b6b16ba93a3c2e8fff84d24d6ec760f9003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b5096823c346010102000000915b1234b8801aeb1fe4bc0c592ac6710ed3d0181755f24b362d695e1afaa1b3f257dbfe3874c203003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b50950',
          decoded_op_name: 'jetton_transfer',
          decoded_body: {
            query_id: 0,
            amount: '10000000000000',
            destination:
              '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
            response_destination:
              '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
            custom_payload: 'b5ee9c72010101010002000000',
            forward_ton_amount: '300000000',
            forward_payload: {
              is_right: true,
              value: {
                sum_type: 'Cell',
                op_code: 1527919800,
                value:
                  'b5ee9c7201010101004b0000915b1234b8801aeb1fe4bc0c592ac6710ed3d0181755f24b362d695e1afaa1b3f257dbfe3874c203003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b50950',
              },
            },
          },
        },
        out_msgs: [],
        block: '(0,6000000000000000,19608023)',
        prev_trans_hash:
          '9030381fbfe4f271ba9b5fa82d868ddd398f7dd0b8b18bf46b2fb797b0c91608',
        prev_trans_lt: 20513910000003,
        compute_phase: {
          skipped: false,
          success: true,
          gas_fees: 8706000,
          gas_used: 8706,
          vm_steps: 175,
          exit_code: 0,
        },
        storage_phase: {
          fees_collected: 1063,
          status_change: 'acst_unchanged',
        },
        credit_phase: {
          fees_collected: 0,
          credit: 400000000,
        },
        action_phase: {
          success: true,
          result_code: 0,
          total_actions: 1,
          skipped_actions: 0,
          fwd_fees: 10910000,
          total_fees: 3636611,
        },
        aborted: false,
        destroyed: false,
      },
      interfaces: ['jetton_wallet'],
      children: [
        {
          transaction: {
            hash: '11b116a6ec573faad19497efa323c6ba47fae10ec081aac62ca6015172b14b40',
            lt: 20515357000003,
            account: {
              address:
                '0:55b640859c0eb210ac00147bf01a4ccc1ed7f18a85a046c75f869801956b6ecf',
              is_scam: false,
              is_wallet: false,
            },
            success: true,
            utime: 1712306028,
            orig_status: 'active',
            end_status: 'active',
            total_fees: 11090045,
            transaction_type: 'TransOrd',
            state_update_old:
              '1183008f59f00424918ec9bd222073471d2ca1b193072033b1e95f3fa9a0a04d',
            state_update_new:
              '1c0a95fbaf5f6c62974227f86368cc5e4cf8769e3646bfadc8c761e720056d27',
            in_msg: {
              msg_type: 'int_msg',
              created_lt: 20515357000002,
              ihr_disabled: true,
              bounce: true,
              bounced: false,
              value: 380384000,
              fwd_fee: 7273389,
              ihr_fee: 0,
              destination: {
                address:
                  '0:55b640859c0eb210ac00147bf01a4ccc1ed7f18a85a046c75f869801956b6ecf',
                is_scam: false,
                is_wallet: false,
              },
              source: {
                address:
                  '0:63133dc04c9584a6cade602be22f0d81b0d45eefcb940bba2527911e6e6b11f3',
                is_scam: false,
                is_wallet: false,
              },
              import_fee: 0,
              created_at: 1712306028,
              op_code: '0x178d4519',
              raw_body:
                'b5ee9c720101020100a80001b3178d45190000000000000000609184e72a000801df362c99f6176102d73badaa0df3a2d68995e945a2e08fc5d17d9b41b0bda84b003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b5095047868c030100915b1234b8801aeb1fe4bc0c592ac6710ed3d0181755f24b362d695e1afaa1b3f257dbfe3874c203003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b50950',
              decoded_op_name: 'jetton_internal_transfer',
              decoded_body: {
                query_id: 0,
                amount: '10000000000000',
                from: '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                response_address:
                  '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                forward_ton_amount: '300000000',
              },
            },
            out_msgs: [],
            block: '(0,6000000000000000,19608023)',
            prev_trans_hash:
              'a2f1d8adb454f32d3984a5d4b8de38aa9142be44bc3b0a221139ecd427cdd329',
            prev_trans_lt: 20513910000001,
            compute_phase: {
              skipped: false,
              success: true,
              gas_fees: 10024000,
              gas_used: 10024,
              vm_steps: 190,
              exit_code: 0,
            },
            storage_phase: {
              fees_collected: 1062,
              status_change: 'acst_unchanged',
            },
            credit_phase: {
              fees_collected: 0,
              credit: 380384000,
            },
            action_phase: {
              success: true,
              result_code: 0,
              total_actions: 2,
              skipped_actions: 0,
              fwd_fees: 3195000,
              total_fees: 1064983,
            },
            aborted: false,
            destroyed: false,
          },
          interfaces: ['jetton_wallet'],
          children: [
            {
              transaction: {
                hash: 'b597c14d4ad02b75b17d5fcf5080f883c922d4254da6fd6103e6946d39061722',
                lt: 20515361000001,
                account: {
                  address:
                    '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
                  is_scam: false,
                  is_wallet: false,
                },
                success: true,
                utime: 1712306037,
                orig_status: 'active',
                end_status: 'active',
                total_fees: 11931911,
                transaction_type: 'TransOrd',
                state_update_old:
                  'fb1be159534b045ce0e92501a6a3f2e5d34d3f690369b442e6331629fb1bbc3a',
                state_update_new:
                  '79114558a0c21eca6fd9625488aff1d43190e3115a60f409bbdc31aae1b83e1e',
                in_msg: {
                  msg_type: 'int_msg',
                  created_lt: 20515357000004,
                  ihr_disabled: true,
                  bounce: false,
                  bounced: false,
                  value: 300000000,
                  fwd_fee: 1463345,
                  ihr_fee: 0,
                  destination: {
                    address:
                      '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
                    is_scam: false,
                    is_wallet: false,
                  },
                  source: {
                    address:
                      '0:55b640859c0eb210ac00147bf01a4ccc1ed7f18a85a046c75f869801956b6ecf',
                    is_scam: false,
                    is_wallet: false,
                  },
                  import_fee: 0,
                  created_at: 1712306028,
                  op_code: '0x7362d09c',
                  raw_body:
                    'b5ee9c720101020100820001687362d09c0000000000000000609184e72a000801df362c99f6176102d73badaa0df3a2d68995e945a2e08fc5d17d9b41b0bda84b0100915b1234b8801aeb1fe4bc0c592ac6710ed3d0181755f24b362d695e1afaa1b3f257dbfe3874c203003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b50950',
                  decoded_op_name: 'jetton_notify',
                  decoded_body: {
                    query_id: 0,
                    amount: '10000000000000',
                    sender:
                      '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                    forward_payload: {
                      is_right: true,
                      value: {
                        sum_type: 'Cell',
                        op_code: 1527919800,
                        value:
                          'b5ee9c7201010101004b0000915b1234b8801aeb1fe4bc0c592ac6710ed3d0181755f24b362d695e1afaa1b3f257dbfe3874c203003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b50950',
                      },
                    },
                  },
                },
                out_msgs: [],
                block: '(0,a000000000000000,19608710)',
                prev_trans_hash:
                  '45ff1417a122bb6e244a32483841bc96e818e5971a2db4fa1a39dd6dba738130',
                prev_trans_lt: 20515316000005,
                compute_phase: {
                  skipped: false,
                  success: true,
                  gas_fees: 11211000,
                  gas_used: 11211,
                  vm_steps: 231,
                  exit_code: 0,
                },
                storage_phase: {
                  fees_collected: 256,
                  status_change: 'acst_unchanged',
                },
                credit_phase: {
                  fees_collected: 0,
                  credit: 300000000,
                },
                action_phase: {
                  success: true,
                  result_code: 0,
                  total_actions: 1,
                  skipped_actions: 0,
                  fwd_fees: 2162000,
                  total_fees: 720655,
                },
                aborted: false,
                destroyed: false,
              },
              interfaces: ['stonfi_router'],
              children: [
                {
                  transaction: {
                    hash: '7997fd4fbed23ee032ea7882b12b09cc5dd26d4a29429df1f249d9b75b920406',
                    lt: 20515365000001,
                    account: {
                      address:
                        '0:14d0822d1495a6ddd045266a40ee6b0f35eafa1742e0837f90af50abd5c5230e',
                      is_scam: false,
                      is_wallet: false,
                    },
                    success: true,
                    utime: 1712306050,
                    orig_status: 'active',
                    end_status: 'active',
                    total_fees: 11969885,
                    transaction_type: 'TransOrd',
                    state_update_old:
                      '67f2cd8d193e6c192e67c08cbd5b3bae2f92cca54c2fc31ed7d60a1b89931bb9',
                    state_update_new:
                      'df69ac6893159f4538bbcceefc33dacb4df1fef379a3a83e797452a256443906',
                    in_msg: {
                      msg_type: 'int_msg',
                      created_lt: 20515361000002,
                      ihr_disabled: true,
                      bounce: true,
                      bounced: false,
                      value: 286627000,
                      fwd_fee: 1441345,
                      ihr_fee: 0,
                      destination: {
                        address:
                          '0:14d0822d1495a6ddd045266a40ee6b0f35eafa1742e0837f90af50abd5c5230e',
                        is_scam: false,
                        is_wallet: false,
                      },
                      source: {
                        address:
                          '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
                        is_scam: false,
                        is_wallet: false,
                      },
                      import_fee: 0,
                      created_at: 1712306037,
                      op_code: '0x5b1234b8',
                      raw_body:
                        'b5ee9c7201010201007e0001ad5b1234b80000000000000000801df362c99f6176102d73badaa0df3a2d68995e945a2e08fc5d17d9b41b0bda84b00156d90216703ac842b00051efc06933307b5fc62a16811b1d7e1a600655adbb3d8246139ca8000405010043801df362c99f6176102d73badaa0df3a2d68995e945a2e08fc5d17d9b41b0bda84b0',
                    },
                    out_msgs: [],
                    block: '(0,2000000000000000,19609597)',
                    prev_trans_hash:
                      '89473d66043be8439a4fbdaf615968b43ec8dbe2e2947895da446fee797d34a2',
                    prev_trans_lt: 20513905000001,
                    compute_phase: {
                      skipped: false,
                      success: true,
                      gas_fees: 11238000,
                      gas_used: 11238,
                      vm_steps: 303,
                      exit_code: 0,
                    },
                    storage_phase: {
                      fees_collected: 8563,
                      status_change: 'acst_unchanged',
                    },
                    credit_phase: {
                      fees_collected: 0,
                      credit: 286627000,
                    },
                    action_phase: {
                      success: true,
                      result_code: 0,
                      total_actions: 1,
                      skipped_actions: 0,
                      fwd_fees: 2170000,
                      total_fees: 723322,
                    },
                    aborted: false,
                    destroyed: false,
                  },
                  interfaces: ['jetton_master', 'stonfi_pool'],
                  children: [
                    {
                      transaction: {
                        hash: 'a8c980c13b82229c1f0e91911bf22a745f0bc3d9687bfc86631579cc0b160bb7',
                        lt: 20515368000001,
                        account: {
                          address:
                            '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
                          is_scam: false,
                          is_wallet: false,
                        },
                        success: true,
                        utime: 1712306059,
                        orig_status: 'active',
                        end_status: 'active',
                        total_fees: 13857364,
                        transaction_type: 'TransOrd',
                        state_update_old:
                          '79114558a0c21eca6fd9625488aff1d43190e3115a60f409bbdc31aae1b83e1e',
                        state_update_new:
                          'c059331de2d79d3abd700086afb55040e26c45c942f37d2215652644ed1be70a',
                        in_msg: {
                          msg_type: 'int_msg',
                          created_lt: 20515365000002,
                          ihr_disabled: true,
                          bounce: false,
                          bounced: false,
                          value: 273219000,
                          fwd_fee: 1446678,
                          ihr_fee: 0,
                          destination: {
                            address:
                              '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
                            is_scam: false,
                            is_wallet: false,
                          },
                          source: {
                            address:
                              '0:14d0822d1495a6ddd045266a40ee6b0f35eafa1742e0837f90af50abd5c5230e',
                            is_scam: false,
                            is_wallet: false,
                          },
                          import_fee: 0,
                          created_at: 1712306050,
                          op_code: '0x15a737f2',
                          raw_body:
                            'b5ee9c7201010201007f00016315a737f20000000000000000801df362c99f6176102d73badaa0df3a2d68995e945a2e08fc5d17d9b41b0bda84a46f4a4d7801008f4062dcf7e801aeb1fe4bc0c592ac6710ed3d0181755f24b362d695e1afaa1b3f257dbfe3874c100156d90216703ac842b00051efc06933307b5fc62a16811b1d7e1a600655adbb3e',
                        },
                        out_msgs: [],
                        block: '(0,a000000000000000,19608717)',
                        prev_trans_hash:
                          'b597c14d4ad02b75b17d5fcf5080f883c922d4254da6fd6103e6946d39061722',
                        prev_trans_lt: 20515361000001,
                        compute_phase: {
                          skipped: false,
                          success: true,
                          gas_fees: 13256000,
                          gas_used: 13256,
                          vm_steps: 295,
                          exit_code: 0,
                        },
                        storage_phase: {
                          fees_collected: 40,
                          status_change: 'acst_unchanged',
                        },
                        credit_phase: {
                          fees_collected: 0,
                          credit: 273219000,
                        },
                        action_phase: {
                          success: true,
                          result_code: 0,
                          total_actions: 1,
                          skipped_actions: 0,
                          fwd_fees: 1804000,
                          total_fees: 601324,
                        },
                        aborted: false,
                        destroyed: false,
                      },
                      interfaces: ['stonfi_router'],
                      children: [
                        {
                          transaction: {
                            hash: '86f8870c19ce13348ad6d52aef4bafd823a1cacede6ca28a00cca283e60b2a31',
                            lt: 20515371000001,
                            account: {
                              address:
                                '0:d758ff25e062c9563388769e80c0baaf9259b16b4af0d7d50d9f92bedff1c3a6',
                              is_scam: false,
                              is_wallet: false,
                            },
                            success: true,
                            utime: 1712306069,
                            orig_status: 'active',
                            end_status: 'active',
                            total_fees: 6661705,
                            transaction_type: 'TransOrd',
                            state_update_old:
                              'f556549e4a37dacef3e9068f54dce2b6952c32d5064585059069221b64c7a07b',
                            state_update_new:
                              '9b4c5e52620db524b0d3590ed04541dde51e90e4fce7631d635a820ecbf936c0',
                            in_msg: {
                              msg_type: 'int_msg',
                              created_lt: 20515368000002,
                              ihr_disabled: true,
                              bounce: true,
                              bounced: false,
                              value: 258159000,
                              fwd_fee: 1202676,
                              ihr_fee: 0,
                              destination: {
                                address:
                                  '0:d758ff25e062c9563388769e80c0baaf9259b16b4af0d7d50d9f92bedff1c3a6',
                                is_scam: false,
                                is_wallet: false,
                              },
                              source: {
                                address:
                                  '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
                                is_scam: false,
                                is_wallet: false,
                              },
                              import_fee: 0,
                              created_at: 1712306059,
                              op_code: '0x0f8a7ea5',
                              raw_body:
                                'b5ee9c7201010101005a0000b00f8a7ea500000000000000004062dcf7e801df362c99f6176102d73badaa0df3a2d68995e945a2e08fc5d17d9b41b0bda84b003be6c5933ec2ec205ae775b541be745ad132bd28b45c11f8ba2fb3683617b50940237a526b',
                              decoded_op_name: 'jetton_transfer',
                              decoded_body: {
                                query_id: 0,
                                amount: '103665534',
                                destination:
                                  '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                                response_destination:
                                  '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                                custom_payload: null,
                                forward_ton_amount: '0',
                                forward_payload: {
                                  is_right: false,
                                  value: {
                                    sum_type: 'Cell',
                                    op_code: 595219051,
                                    value: 'b5ee9c72010101010006000008237a526b',
                                  },
                                },
                              },
                            },
                            out_msgs: [],
                            block: '(0,e000000000000000,19607800)',
                            prev_trans_hash:
                              '57b3635237949ae723037dd397755cfdcd30ce084991ddcd69b1359e466079cb',
                            prev_trans_lt: 20515319000001,
                            compute_phase: {
                              skipped: false,
                              success: true,
                              gas_fees: 6151000,
                              gas_used: 6151,
                              vm_steps: 149,
                              exit_code: 0,
                            },
                            storage_phase: {
                              fees_collected: 47,
                              status_change: 'acst_unchanged',
                            },
                            credit_phase: {
                              fees_collected: 0,
                              credit: 258159000,
                            },
                            action_phase: {
                              success: true,
                              result_code: 0,
                              total_actions: 1,
                              skipped_actions: 0,
                              fwd_fees: 1532000,
                              total_fees: 510658,
                            },
                            aborted: false,
                            destroyed: false,
                          },
                          interfaces: ['jetton_wallet'],
                          children: [
                            {
                              transaction: {
                                hash: '3d5a7abf35d483c4d31215005df43d26cdca1474aa3117a586480b0deaef68d9',
                                lt: 20515371000003,
                                account: {
                                  address:
                                    '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                                  is_scam: false,
                                  is_wallet: true,
                                },
                                success: true,
                                utime: 1712306069,
                                orig_status: 'active',
                                end_status: 'active',
                                total_fees: 991008,
                                transaction_type: 'TransOrd',
                                state_update_old:
                                  '398941d4bd512ea16bcb32cd4db51eee352b939fe846b931af241d509d3851b2',
                                state_update_new:
                                  'c841cc120b213f920fc1f225fb482f0a35ce067d02a7991d1fcc0e73be973e91',
                                in_msg: {
                                  msg_type: 'int_msg',
                                  created_lt: 20515371000002,
                                  ihr_disabled: true,
                                  bounce: false,
                                  bounced: false,
                                  value: 250476000,
                                  fwd_fee: 1021342,
                                  ihr_fee: 0,
                                  destination: {
                                    address:
                                      '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                                    is_scam: false,
                                    is_wallet: true,
                                  },
                                  source: {
                                    address:
                                      '0:d758ff25e062c9563388769e80c0baaf9259b16b4af0d7d50d9f92bedff1c3a6',
                                    is_scam: false,
                                    is_wallet: false,
                                  },
                                  import_fee: 0,
                                  created_at: 1712306069,
                                  op_code: '0x7362d09c',
                                  raw_body:
                                    'b5ee9c7201010101003800006c7362d09c00000000000000004062dcf7e8016eee66c8b147f85d6b9d97a378a17478b6b16ba93a3c2e8fff84d24d6ec760f8237a526b',
                                  decoded_op_name: 'jetton_notify',
                                  decoded_body: {
                                    query_id: 0,
                                    amount: '103665534',
                                    sender:
                                      '0:b777336458a3fc2eb5cecbd1bc50ba3c5b58b5d49d1e1747ffc26926b763b07c',
                                    forward_payload: {
                                      is_right: false,
                                      value: {
                                        sum_type: 'Cell',
                                        op_code: 595219051,
                                        value:
                                          'b5ee9c72010101010006000008237a526b',
                                      },
                                    },
                                  },
                                },
                                out_msgs: [],
                                block: '(0,e000000000000000,19607800)',
                                prev_trans_hash:
                                  '9958465ea4024bbe666407537ad1bf9577b4002f4fc91d8ef98f9bceb2b60dc2',
                                prev_trans_lt: 20515361000001,
                                compute_phase: {
                                  skipped: false,
                                  success: true,
                                  gas_fees: 991000,
                                  gas_used: 991,
                                  vm_steps: 29,
                                  exit_code: 0,
                                },
                                storage_phase: {
                                  fees_collected: 8,
                                  status_change: 'acst_unchanged',
                                },
                                credit_phase: {
                                  fees_collected: 0,
                                  credit: 250476000,
                                },
                                action_phase: {
                                  success: true,
                                  result_code: 0,
                                  total_actions: 0,
                                  skipped_actions: 0,
                                  fwd_fees: 0,
                                  total_fees: 0,
                                },
                                aborted: false,
                                destroyed: false,
                              },
                              interfaces: ['wallet_v4r2'],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              transaction: {
                hash: '9958465ea4024bbe666407537ad1bf9577b4002f4fc91d8ef98f9bceb2b60dc2',
                lt: 20515361000001,
                account: {
                  address:
                    '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                  is_scam: false,
                  is_wallet: true,
                },
                success: true,
                utime: 1712306040,
                orig_status: 'active',
                end_status: 'active',
                total_fees: 991006,
                transaction_type: 'TransOrd',
                state_update_old:
                  '7536638860d084e5dd7cffe5a55d39fa51a57e89449b45279fff6f2a647ababd',
                state_update_new:
                  '398941d4bd512ea16bcb32cd4db51eee352b939fe846b931af241d509d3851b2',
                in_msg: {
                  msg_type: 'int_msg',
                  created_lt: 20515357000005,
                  ihr_disabled: true,
                  bounce: false,
                  bounced: false,
                  value: 58473917,
                  fwd_fee: 666672,
                  ihr_fee: 0,
                  destination: {
                    address:
                      '0:ef9b164cfb0bb0816b9dd6d506f9d16b44caf4a2d17047e2e8becda0d85ed425',
                    is_scam: false,
                    is_wallet: true,
                  },
                  source: {
                    address:
                      '0:55b640859c0eb210ac00147bf01a4ccc1ed7f18a85a046c75f869801956b6ecf',
                    is_scam: false,
                    is_wallet: false,
                  },
                  import_fee: 0,
                  created_at: 1712306028,
                  op_code: '0xd53276db',
                  raw_body:
                    'b5ee9c7201010101000e000018d53276db0000000000000000',
                  decoded_op_name: 'excess',
                  decoded_body: {
                    query_id: 0,
                  },
                },
                out_msgs: [],
                block: '(0,e000000000000000,19607790)',
                prev_trans_hash:
                  '3e7802d76c1b081990831354a279c3f0d22de96560d888e76b248ac79d795d23',
                prev_trans_lt: 20515354000001,
                compute_phase: {
                  skipped: false,
                  success: true,
                  gas_fees: 991000,
                  gas_used: 991,
                  vm_steps: 29,
                  exit_code: 0,
                },
                storage_phase: {
                  fees_collected: 6,
                  status_change: 'acst_unchanged',
                },
                credit_phase: {
                  fees_collected: 0,
                  credit: 58473917,
                },
                action_phase: {
                  success: true,
                  result_code: 0,
                  total_actions: 0,
                  skipped_actions: 0,
                  fwd_fees: 0,
                  total_fees: 0,
                },
                aborted: false,
                destroyed: false,
              },
              interfaces: ['wallet_v4r2'],
            },
          ],
        },
      ],
    },
  ],
}
