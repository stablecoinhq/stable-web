import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

import getTranslationProps from './getTranslationProps';

import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ItemProps = {
  cardTitle: string;
  cardBody: string;
  buttonTitle: string;
  href: string;
};

const Item: FC<ItemProps> = ({ cardTitle, cardBody, buttonTitle, href }) => (
  <Grid item xs={6}>
    <Card>
      <CardContent>
        <Typography variant="h5">{cardTitle}</Typography>
        <Typography variant="body2">{cardBody}</Typography>
      </CardContent>
      <CardActions>
        <Link href={href} passHref>
          <Button endIcon={<ArrowForwardIcon />} style={{ justifyContent: 'start' }} fullWidth>
            {buttonTitle}
          </Button>
        </Link>
      </CardActions>
    </Card>
  </Grid>
);

const Home: NextPageWithEthereum = () => {
  const { t } = useTranslation('common', { keyPrefix: 'pages' });

  return (
    <Grid container spacing={4}>
      <Item cardTitle={t('vault.cardTitle')} cardBody={t('vault.cardDesc')} buttonTitle={t('vault.listTitle')} href="/vaults" />
      <Item cardTitle={t('earn.cardTitle')} cardBody={t('earn.cardDesc')} buttonTitle="Earn" href="/earn" />
    </Grid>
  );
};

export const getStaticProps = getTranslationProps;
export default Home;
