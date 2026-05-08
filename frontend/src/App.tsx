import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {ProductsPage} from './pages/ProductsPage';
import {DishesPage} from './pages/DishesPage';
import {Navbar} from './components/navbar';

function App() {
    const [opened, {toggle}] = useDisclosure();
    return (
        <BrowserRouter>
            <AppShell header={{
                height: 60
            }} navbar={{
                width: 240,
                breakpoint: "sm",
                collapsed: {
                    mobile: !opened
                }
            }} padding="md">
                <AppShell.Header>
                    <Group h="100%" px="md" align="center">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm"></Burger>
                        <Title order={3}>Книга рецептов</Title>
                    </Group>
                </AppShell.Header>
                <AppShell.Navbar p="md">
                    <Navbar></Navbar>
                </AppShell.Navbar>
                <AppShell.Main>
                    <Routes>
                        <Route path="/" element={<ProductsPage></ProductsPage>}></Route>
                        <Route path="/dishes" element={<DishesPage></DishesPage>}></Route>
                    </Routes>
                </AppShell.Main>
            </AppShell>
        </BrowserRouter>
    );
}

export default App;