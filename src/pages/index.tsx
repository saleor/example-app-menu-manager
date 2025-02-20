import { Box, Button, Input, Option, PlusIcon, Select, Text, TrashBinIcon } from "@saleor/macaw-ui";
import { useState } from "react";

import {
  useCreateMenuMutation,
  useGetCategoriesQuery,
  useGetCollectionsQuery,
  useGetMenusQuery,
  useGetPagesQuery,
} from "../../generated/graphql";

interface Menu {
  id: string;
  name: string;
  slug: string;
  items: Array<{
    id: string;
    name: string;
    level: number;
  }>;
}

interface MenusResponse {
  edges: Array<{
    node: Menu;
  }>;
  totalCount: number;
}

interface SelectOption extends Option {
  value: string;
  label: string;
}

interface MenuItem {
  name: string;
  categoryId?: SelectOption | null;
  collectionId?: SelectOption | null;
  pageId?: SelectOption | null;
}

export default function MenusPage() {
  const [error, setError] = useState<string | null>(null);
  const [newMenu, setNewMenu] = useState({ name: "", slug: "" });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [{ data: menusData, fetching: loading }] = useGetMenusQuery({
    variables: { first: 100 },
  });
  const [{ data: categoriesData }] = useGetCategoriesQuery({
    variables: { first: 100 },
  });
  const [{ data: collectionsData }] = useGetCollectionsQuery({
    variables: { first: 100 },
  });
  const [{ data: pagesData }] = useGetPagesQuery({
    variables: { first: 100 },
  });
  const [, createMenu] = useCreateMenuMutation();

  const menus = menusData?.menus?.edges.map((edge) => edge.node) ?? [];
  const categories = categoriesData?.categories?.edges.map((edge) => edge.node) ?? [];
  const collections = collectionsData?.collections?.edges.map((edge) => edge.node) ?? [];
  const pages = pagesData?.pages?.edges.map((edge) => edge.node) ?? [];

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createMenu({
        input: {
          name: newMenu.name,
          slug: newMenu.slug || undefined,
          items: menuItems.map((item) => ({
            name: item.name,
            category: item.categoryId?.value,
            collection: item.collectionId?.value,
            page: item.pageId?.value,
          })),
        },
      });

      if (result.error) {
        throw result.error;
      }

      if (result.data?.menuCreate?.errors?.length) {
        throw new Error(result.data.menuCreate.errors.map((e) => e.message).join(", "));
      }

      setNewMenu({ name: "", slug: "" });
      setMenuItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create menu");
      console.error(err);
    }
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: "" }]);
  };

  const updateMenuItem = (index: number, updates: Partial<MenuItem>) => {
    setMenuItems(menuItems.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Box>
        <Text>Loading menus...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="critical1">{error}</Text>
        <Button onClick={() => setError(null)}>Dismiss</Button>
      </Box>
    );
  }

  return (
    <Box padding={6}>
      <Box marginBottom={8}>
        <Text as="h1" size={5}>
          Menus
        </Text>
      </Box>

      {/* Create Menu Form */}
      <Box
        as="form"
        onSubmit={handleCreateMenu}
        display="grid"
        gap={4}
        marginBottom={8}
        borderColor="default1"
        borderWidth={1}
        borderStyle="solid"
        padding={4}
      >
        <Text fontWeight="bold" as="h2" size={4}>
          Create New Menu
        </Text>
        <Box display="flex" gap={4} flexDirection={"column"} alignItems={"flex-start"}>
          <Input
            value={newMenu.name}
            onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
            label="Menu name"
            required
          />

          {/* Menu Items */}
          <Box paddingLeft={8} display="grid" gap={4}>
            {menuItems.map((item, index) => (
              <Box
                key={index}
                display="grid"
                __gridTemplateColumns={"1fr 1fr 1fr 1fr auto"}
                gap={2}
              >
                <Input
                  value={item.name}
                  onChange={(e) => updateMenuItem(index, { name: e.target.value })}
                  label="Item name"
                  required
                />
                <Select
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  value={item.categoryId || null}
                  onChange={(value) => updateMenuItem(index, { categoryId: value as SelectOption })}
                  label="Category"
                />
                <Select
                  options={collections.map((col) => ({
                    value: col.id,
                    label: col.name,
                  }))}
                  value={item.collectionId || null}
                  onChange={(value) =>
                    updateMenuItem(index, { collectionId: value as SelectOption })
                  }
                  label="Collection"
                />
                <Select
                  options={pages.map((page) => ({
                    value: page.id,
                    label: page.title,
                  }))}
                  value={item.pageId || null}
                  onChange={(value) => updateMenuItem(index, { pageId: value as SelectOption })}
                  label="Page"
                />
                <Button
                  icon={<TrashBinIcon />}
                  onClick={() => removeMenuItem(index)}
                  type="button"
                  variant="tertiary"
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Box display="flex" alignItems="center" gap={2}>
              <Button icon={<PlusIcon />} variant="secondary" onClick={addMenuItem} type="button">
                Add Item
              </Button>
            </Box>
          </Box>

          <Button type="submit">Create Menu</Button>
        </Box>
      </Box>

      {/* Menus List */}
      <Box>
        <Box display="grid" gap={2}>
          <Box display="flex" justifyContent="space-between">
            <Text>Name</Text>
            <Text>Items Count</Text>
          </Box>
          {menus.map((menu) => (
            <Box key={menu.id} display="flex" justifyContent="space-between">
              <Text>{menu.name}</Text>
              <Text>{menu.items?.length ?? 0}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      {menus.length === 0 && (
        <Box padding={4} textAlign="center">
          <Text color="default1">No menus found</Text>
        </Box>
      )}
    </Box>
  );
}
