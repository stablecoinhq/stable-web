import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Button, Card, CardActions, CardContent, CardHeader, CircularProgress, Grid, Typography } from '@mui/material';
import Link from 'next/link';
import { useCallback } from 'react';

import ChainLogHelper from 'contracts/ChainLogHelper';
import usePromiseFactory from 'pages/usePromiseFactory';

import type EthereumProvider from 'contracts/EthereumProvider';
import type IlkType from 'contracts/IlkType';
import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

const useIlks = (provider: EthereumProvider) =>
  usePromiseFactory(
    useCallback(async () => new ChainLogHelper(provider).ilkRegistry().then((ilkRegistry) => ilkRegistry.list()), [provider]),
  );

type RenderIlkProps = {
  ilk: IlkType;
};

const RenderIlk: FC<RenderIlkProps> = ({ ilk }) => (
  <Grid item xs={6}>
    <Card>
      <CardHeader title={ilk.inString} />
      <CardActions>
        <Link href={`/ilks/${ilk.inString}`} passHref>
          <Button endIcon={<ArrowForwardIcon />} style={{ justifyContent: 'start' }} fullWidth>
            Open new {ilk.inString} vault
          </Button>
        </Link>
      </CardActions>
    </Card>
  </Grid>
);

type ContentProps = {
  ilks: IlkType[] | undefined;
};

const Content: FC<ContentProps> = ({ ilks }) => {
  if (!ilks) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (ilks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" padding={2}>
        <Typography variant="subtitle1">No ilks found.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {ilks.map((ilk) => (
        <RenderIlk key={ilk.inString} ilk={ilk} />
      ))}
    </Grid>
  );
};

const OpenVault: NextPageWithEthereum = ({ provider }) => {
  const ilks = useIlks(provider);

  return (
    <Card elevation={0}>
      <CardHeader title="Open new vault" />
      <CardContent>
        <Content ilks={ilks} />
      </CardContent>
    </Card>
  );
};

export default OpenVault;
