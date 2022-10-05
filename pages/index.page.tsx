import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material';
import Link from 'next/link';

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

const Home: NextPageWithEthereum = () => (
  <Grid container spacing={4}>
    <Item
      cardTitle="Manage Vaults"
      cardBody="Create a new vault or manage your existing vaults."
      buttonTitle="Vaults"
      href="/vaults"
    />
  </Grid>
);

export default Home;
