import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import type { NextPageWithEthereum } from 'next';
import type { FC } from 'react';

type ItemProps = {
  cardTitle: string;
  cardBody: string;
  buttonTitle: string;
  route: string;
};

const Item: FC<ItemProps> = ({ cardTitle, cardBody, buttonTitle, route }) => {
  const router = useRouter();

  const navigate = useCallback(() => {
    void router.push(route);
  }, [router, route]);

  return (
    <Grid item xs={6}>
      <Card>
        <CardContent>
          <Typography variant="h5">{cardTitle}</Typography>
          <Typography variant="body2">{cardBody}</Typography>
        </CardContent>
        <CardActions>
          <Button endIcon={<ArrowForwardIcon />} onClick={navigate} style={{ justifyContent: 'start' }} fullWidth>
            {buttonTitle}
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
};

const Home: NextPageWithEthereum = () => (
  <Grid container spacing={4}>
    <Item
      cardTitle="Manage Vaults"
      cardBody="Create a new vault or manage your existing vaults."
      buttonTitle="Vaults"
      route="/vaults"
    />
  </Grid>
);

export default Home;
