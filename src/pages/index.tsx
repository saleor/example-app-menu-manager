import {
  Box,
  Button,
  CloseIcon,
  Input,
  Modal,
  Option,
  PlusIcon,
  Select,
  Text,
  TrashBinIcon,
} from "@saleor/macaw-ui";
import { useState } from "react";

import {
  useCreateMenuMutation,
  useDeleteMenuMutation,
  useGetCategoriesQuery,
  useGetCollectionsQuery,
  useGetMenusQuery,
  useGetPagesQuery,
} from "../../generated/graphql";

interface SelectOption extends Option {
  value: string;
  label: string;
}

interface MenuItemForm {
  name: string;
  categoryId?: SelectOption | null;
  collectionId?: SelectOption | null;
  pageId?: SelectOption | null;
}

export default function MenusPage() {
  const [error, setError] = useState<string | null>(null);
  const [newMenu, setNewMenu] = useState({ name: "", slug: "" });
  const [menuItems, setMenuItems] = useState<MenuItemForm[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [{ data: menusData, fetching: loading }, refetchMenus] = useGetMenusQuery({
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
  const [, deleteMenu] = useDeleteMenuMutation();

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
      setIsCreateModalOpen(false);
      refetchMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create menu");
      console.error(err);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    try {
      const result = await deleteMenu({
        id,
      });

      if (result.error) {
        throw result.error;
      }

      if (result.data?.menuDelete?.errors?.length) {
        throw new Error(result.data.menuDelete.errors.map((e) => e.message).join(", "));
      }

      refetchMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete menu");
      console.error(err);
    }
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: "" }]);
  };

  const updateMenuItem = (index: number, updates: Partial<MenuItemForm>) => {
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
        <Text fontWeight="bold" as="h1" size={11}>
          Example Menu Manager
        </Text>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Text fontWeight="bold" as="h2" size={6}>
          Menus
        </Text>
        <Modal onChange={() => setIsCreateModalOpen(!isCreateModalOpen)}>
          <Modal.Trigger>
            <Button>Create New Menu</Button>
          </Modal.Trigger>
          <Modal.Content>
            <Box
              __left="50%"
              __top="50%"
              __transform="translate(-50%, -50%)"
              __maxWidth="640px"
              width="100%"
              backgroundColor="default1"
              boxShadow="defaultModal"
              position="fixed"
              padding={8}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginBottom={4}
              >
                <Text as="h2" size={5}>
                  Create New Menu
                </Text>
                <Modal.Close>
                  <Button
                    icon={<CloseIcon />}
                    size="small"
                    variant="tertiary"
                    onClick={() => {
                      setNewMenu({ name: "", slug: "" });
                      setMenuItems([]);
                    }}
                  />
                </Modal.Close>
              </Box>

              <Box as="form" onSubmit={handleCreateMenu} display="grid" gap={4}>
                <Input
                  value={newMenu.name}
                  onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                  label="Menu name"
                  required
                />

                {/* Menu Items */}
                <Box display="grid" gap={4}>
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
                        onChange={(value) =>
                          updateMenuItem(index, { categoryId: value as SelectOption })
                        }
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
                        onChange={(value) =>
                          updateMenuItem(index, { pageId: value as SelectOption })
                        }
                        label="Page"
                      />
                      <Button
                        icon={<CloseIcon />}
                        onClick={() => removeMenuItem(index)}
                        type="button"
                        variant="tertiary"
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      icon={<PlusIcon />}
                      variant="secondary"
                      onClick={addMenuItem}
                      type="button"
                    >
                      Add Item
                    </Button>
                  </Box>
                </Box>

                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Modal.Close>
                    <Button
                      variant="tertiary"
                      onClick={() => {
                        setNewMenu({ name: "", slug: "" });
                        setMenuItems([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </Modal.Close>
                  <Button type="submit">Create Menu</Button>
                </Box>
              </Box>
            </Box>
          </Modal.Content>
        </Modal>
      </Box>

      <Box display="grid" gap={4}>
        {menus.map((menu) => (
          <Box key={menu.id} borderColor="default1" borderWidth={1} borderStyle="solid" padding={4}>
            <Box display="flex" justifyContent="space-between" marginBottom={4}>
              <Text size={5} fontWeight="bold">
                {menu.name}
              </Text>
              <Button
                icon={<TrashBinIcon />}
                variant="tertiary"
                onClick={() => handleDeleteMenu(menu.id)}
              >
                Delete Menu
              </Button>
            </Box>
            {menu.items && menu.items.length > 0 ? (
              <Box display="grid" gap={2}>
                {menu.items.map((item) => (
                  <Box
                    key={item.id}
                    display="flex"
                    gap={2}
                    alignItems="center"
                    paddingY={2}
                    paddingX={4}
                    borderColor="default1"
                    borderWidth={1}
                    borderStyle="solid"
                  >
                    <Box display="flex" gap={2} alignItems="center" width="100%">
                      <Box>
                        <Text>{item.name}</Text>
                      </Box>
                      <Box display="flex" gap={2} marginLeft="auto">
                        {item.url && (
                          <Box
                            borderColor="default1"
                            borderWidth={1}
                            borderStyle="solid"
                            paddingX={2}
                            paddingY={1}
                            borderRadius={2}
                          >
                            <Text size={2}>URL: {item.url}</Text>
                          </Box>
                        )}
                        {item.category && (
                          <Box
                            borderColor="default1"
                            borderWidth={1}
                            borderStyle="solid"
                            paddingX={2}
                            paddingY={1}
                            borderRadius={2}
                          >
                            <Text size={2}>Category: {item.category.name}</Text>
                          </Box>
                        )}
                        {item.collection && (
                          <Box
                            borderColor="default1"
                            borderWidth={1}
                            borderStyle="solid"
                            paddingX={2}
                            paddingY={1}
                            borderRadius={2}
                          >
                            <Text size={2}>Collection: {item.collection.name}</Text>
                          </Box>
                        )}
                        {item.page && (
                          <Box
                            borderColor="default1"
                            borderWidth={1}
                            borderStyle="solid"
                            paddingX={2}
                            paddingY={1}
                            borderRadius={2}
                          >
                            <Text size={2}>Page: {item.page.title}</Text>
                          </Box>
                        )}
                        {item.level > 0 && (
                          <Box
                            borderColor="default1"
                            borderWidth={1}
                            borderStyle="solid"
                            paddingX={2}
                            paddingY={1}
                            borderRadius={2}
                          >
                            <Text size={2}>Level: {item.level}</Text>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text color="default1">No items in this menu</Text>
            )}
          </Box>
        ))}

        {menus.length === 0 && (
          <Box padding={4} textAlign="center">
            <Text color="default1">No menus found</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
