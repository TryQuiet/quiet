import factoryGirl from 'factory-girl';
import { CustomReduxAdapter } from './reduxAdapter';
import { Store } from '../../sagas/store.types';

import { communities, identity, publicChannels, users } from '../..';
import {
  createMessageSignatureTestHelper,
  createPeerIdTestHelper,
  createRootCertificateTestHelper,
  createUserCertificateTestHelper,
} from './helpers';
import { DateTime } from 'luxon';

export const getFactory = async (store: Store) => {
  const factory = new factoryGirl.FactoryGirl();

  factory.setAdapter(new CustomReduxAdapter(store));

  factory.define(
    'Community',
    communities.actions.addNewCommunity,
    {
      id: factory.sequence('Community.id', (n) => n),
      name: factory.sequence('Community.name', (n) => `community_${n}`),
      CA: await createRootCertificateTestHelper(),
      registrarUrl:
        'ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd:7909',
    },
    {
      afterCreate: async (
        payload: ReturnType<
          typeof communities.actions.addNewCommunity
        >['payload']
      ) => {
        // Set current community if there's no current community set yet
        const currentCommunity = communities.selectors.currentCommunity(
          store.getState()
        );
        if (!currentCommunity) {
          store.dispatch(communities.actions.setCurrentCommunity(payload.id));
        }
        // Create 'general' channel
        await factory.create('CommunityChannels', { id: payload.id });
        await factory.create('PublicChannel', {
          communityId: payload.id,
          channel: { name: 'general', owner: 'holmes' },
        });
        return payload;
      },
    }
  );

  factory.define(
    'Identity',
    identity.actions.addNewIdentity,
    {
      id: factory.assoc('Community', 'id'),
      hiddenService: {
        onionAddress:
          'putnxiwutblglde5i2mczpo37h5n4dvoqkqg2mkxzov7riwqu2owiaid.onion',
        privateKey:
          'ED25519-V3:WND1FoFZyY+c1f0uD6FBWgKvSYl4CdKSizSR7djRekW/rqw5fTw+gN80sGk0gl01sL5i25noliw85zF1BUBRDQ==',
      },
      peerId: createPeerIdTestHelper(),
      dmKeys: {
        publicKey:
          '9f016defcbe48829db163e86b28efb10318faf3b109173105e3dc024e951bb1b',
        privateKey:
          '4dcebbf395c0e9415bc47e52c96fcfaf4bd2485a516f45118c2477036b45fc0b',
      },
      zbayNickname: factory.sequence(
        'Identity.zbayNickname',
        (n) => `user_${n}`
      ),
    },
    {
      afterBuild: async (
        action: ReturnType<typeof identity.actions.addNewIdentity>
      ) => {
        const community = communities.selectors.selectEntities(
          store.getState()
        )[action.payload.id];
        if (community.CA) {
          const userCertData = await createUserCertificateTestHelper(
            {
              zbayNickname: action.payload.zbayNickname,
              commonName: action.payload.hiddenService.onionAddress,
              peerId: action.payload.peerId.id,
            },
            community.CA
          );
          action.payload.userCsr = userCertData.userCsr;
          action.payload.userCertificate = userCertData.userCert.userCertString;
          // Store user's certificate even if the user won't be stored itself
          // (to be able to display messages sent by this user)
          await factory.create('UserCertificate', {
            certificate: action.payload.userCertificate,
          });
        }
        return action;
      },
    }
  );

  factory.define('UserCertificate', users.actions.storeUserCertificate, {
    certificate: factory.assoc('Identity', 'userCertificate'),
  });

  factory.define(
    'CommunityChannels',
    publicChannels.actions.addPublicChannelsList,
    { id: factory.assoc('Community', 'id') }
  );

  factory.define(
    'PublicChannel',
    publicChannels.actions.addChannel,
    {
      communityId: factory.assoc('Identity', 'id'),
      channel: {
        name: factory.sequence(
          'PublicChannel.name',
          (n) => `public_channel_${n}`
        ),
        description: 'Description',
        timestamp: DateTime.utc().toSeconds(),
        owner: factory.assoc('Identity', 'zbayNickname'),
        address: '',
      },
    },
    {
      afterBuild: (
        action: ReturnType<typeof publicChannels.actions.addChannel>
      ) => {
        action.payload.channel.address = action.payload.channel.name;
        return action;
      },
    }
  );

  factory.define(
    'SignedMessage',
    publicChannels.actions.signMessage,
    {
      identity: factory.assoc('Identity'),
      message: {
        id: factory.sequence('SignedMessage.id', (n) => n),
        type: 1,
        message: factory.sequence(
          'SignedMessage.message',
          (n) => `message_${n}`
        ),
        createdAt: DateTime.utc().toSeconds(),
        channelId: '',
        signature: '',
        pubKey: '',
      },
      channelAddress: 'general',
    },
    {
      afterBuild: async (
        action: ReturnType<typeof publicChannels.actions.signMessage>
      ) => {
        const { signature, pubKey } = await createMessageSignatureTestHelper(
          action.payload.message.message,
          action.payload.identity.userCertificate,
          action.payload.identity.userCsr.userKey
        );
        action.payload.message.signature = signature;
        action.payload.message.pubKey = pubKey;
        // Keep channel address the same
        action.payload.message.channelId = action.payload.channelAddress;
        return action;
      },
    }
  );

  return factory;
};
