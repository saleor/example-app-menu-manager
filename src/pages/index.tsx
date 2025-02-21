import {
  Box,
  Button,
  CloseIcon,
  EditIcon,
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
  useCreateMenuItemMutation,
  useCreateMenuMutation,
  useDeleteMenuItemMutation,
  useDeleteMenuMutation,
  useGetCategoriesQuery,
  useGetCollectionsQuery,
  useGetMenusQuery,
  useGetPagesQuery,
  useUpdateMenuMutation,
} from "../../generated/graphql";

interface SelectOption extends Option {
  value: string;
  label: string;
}

interface MenuItem {
  id: string;
  name: string;
  category?: { id: string; name: string } | null;
  collection?: { id: string; name: string } | null;
  page?: { id: string; title: string } | null;
  parent?: { id: string; name: string } | null;
}

interface MenuItemForm {
  name: string;
  categoryId?: SelectOption | null;
  collectionId?: SelectOption | null;
  pageId?: SelectOption | null;
  parentId?: SelectOption | null;
}

const MenuItemRow = ({ item, depth = 0 }: { item: any; depth?: number }) => {
  const indentPadding = depth * 20; // 20px indent per level

  return (
    <>
      <tr key={item.id}>
        <td style={{ padding: "8px", borderBottom: "1px solid var(--border-default1)" }}>
          <Text>{item.id}</Text>
        </td>
        <td style={{ padding: "8px", borderBottom: "1px solid var(--border-default1)" }}>
          <Box style={{ paddingLeft: `${indentPadding}px` }}>
            {depth > 0 && "└─ "}
            <Text>{item.name}</Text>
          </Box>
        </td>
        <td style={{ padding: "8px", borderBottom: "1px solid var(--border-default1)" }}>
          <Text>
            {item.category
              ? "Category"
              : item.collection
              ? "Collection"
              : item.page
              ? "Page"
              : item.url
              ? "URL"
              : ""}
          </Text>
        </td>
        <td style={{ padding: "8px", borderBottom: "1px solid var(--border-default1)" }}>
          <Text>
            {item.category?.name || item.collection?.name || item.page?.title || item.url || ""}
          </Text>
        </td>
        <td style={{ padding: "8px", borderBottom: "1px solid var(--border-default1)" }}>
          <Text>{item.level || 0}</Text>
        </td>
      </tr>
      {item.children?.map((child: any) => (
        <MenuItemRow key={child.id} item={child} depth={depth + 1} />
      ))}
    </>
  );
};

interface MenuFormProps {
  initialMenu?: {
    id?: string;
    name: string;
    slug?: string;
    items: MenuItem[];
  };
  onSubmit: (menu: { name: string; slug?: string; items: any[] }) => Promise<void>;
  onClose: () => void;
}

const MenuForm = ({ initialMenu, onSubmit, onClose }: MenuFormProps) => {
  const [menuData, setMenuData] = useState({
    name: initialMenu?.name || "",
    slug: initialMenu?.slug || "",
  });
  const [menuItems, setMenuItems] = useState<MenuItemForm[]>(
    initialMenu?.items.map((item) => ({
      name: item.name,
      categoryId: item.category ? { value: item.category.id, label: item.category.name } : null,
      collectionId: item.collection
        ? { value: item.collection.id, label: item.collection.name }
        : null,
      pageId: item.page ? { value: item.page.id, label: item.page.title } : null,
      parentId: item.parent ? { value: item.parent.id, label: item.parent.name } : null,
    })) || []
  );

  const [itemIds, setItemIds] = useState<string[]>(initialMenu?.items.map((item) => item.id) || []);

  const [{ data: categoriesData }] = useGetCategoriesQuery({ variables: { first: 100 } });
  const [{ data: collectionsData }] = useGetCollectionsQuery({ variables: { first: 100 } });
  const [{ data: pagesData }] = useGetPagesQuery({ variables: { first: 100 } });

  const categories = categoriesData?.categories?.edges.map((edge) => edge.node) ?? [];
  const collections = collectionsData?.collections?.edges.map((edge) => edge.node) ?? [];
  const pages = pagesData?.pages?.edges.map((edge) => edge.node) ?? [];

  const getAvailableParentItems = (currentIndex: number): SelectOption[] => {
    return menuItems
      .filter((_, index) => index < currentIndex)
      .map((item, index) => ({
        value: itemIds[index] || index.toString(),
        label: item.name,
      }));
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: "" }]);
    setItemIds([...itemIds, `new-${itemIds.length}`]);
  };

  const updateMenuItem = (index: number, updates: Partial<MenuItemForm>) => {
    setMenuItems(menuItems.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
    setItemIds(itemIds.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const processedItems = menuItems.map((item, index) => ({
      name: item.name,
      category: item.categoryId?.value,
      collection: item.collectionId?.value,
      page: item.pageId?.value,
      parent: item.parentId?.value,
      id: itemIds[index],
    }));

    await onSubmit({
      name: menuData.name,
      slug: menuData.slug || undefined,
      items: processedItems,
    });
  };

  return (
    <Box as="form" onSubmit={handleSubmit} display="grid" gap={4}>
      <Input
        value={menuData.name}
        onChange={(e) => setMenuData({ ...menuData, name: e.target.value })}
        label="Menu name"
        required
      />

      {/* Menu Items */}
      <Box display="grid" gap={4}>
        {menuItems.map((item, index) => (
          <Box
            key={index}
            display="grid"
            __gridTemplateColumns={"1fr 1fr 1fr 1fr 1fr auto"}
            gap={2}
          >
            <Input
              value={item.name}
              onChange={(e) => updateMenuItem(index, { name: e.target.value })}
              label="Item name"
              required
            />
            {initialMenu && (
              <Select
                options={getAvailableParentItems(index)}
                value={item.parentId || null}
                onChange={(value) => updateMenuItem(index, { parentId: value as SelectOption })}
                label="Parent Item"
              />
            )}
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
              onChange={(value) => updateMenuItem(index, { collectionId: value as SelectOption })}
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
          <Button icon={<PlusIcon />} variant="secondary" onClick={addMenuItem} type="button">
            Add Item
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button variant="tertiary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{initialMenu ? "Update Menu" : "Create Menu"}</Button>
      </Box>
    </Box>
  );
};

export default function MenusPage() {
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);

  const [{ data: menusData, fetching: loading }, refetchMenus] = useGetMenusQuery({
    variables: { first: 100 },
  });
  const [, createMenu] = useCreateMenuMutation();
  const [, updateMenu] = useUpdateMenuMutation();
  const [, deleteMenu] = useDeleteMenuMutation();
  const [, createMenuItem] = useCreateMenuItemMutation();
  const [, deleteMenuItem] = useDeleteMenuItemMutation();

  const menus = menusData?.menus?.edges.map((edge) => edge.node) ?? [];

  const handleCreateMenu = async (menuData: any) => {
    try {
      // Remove id field and parent references for menu creation
      const input = {
        name: menuData.name,
        slug: menuData.slug,
        items: menuData.items.map((item: any) => ({
          name: item.name,
          category: item.category,
          collection: item.collection,
          page: item.page,
        })),
      };

      const result = await createMenu({
        input,
      });

      if (result.error) {
        throw result.error;
      }

      if (result.data?.menuCreate?.errors?.length) {
        throw new Error(result.data.menuCreate.errors.map((e) => e.message).join(", "));
      }

      setIsModalOpen(false);
      refetchMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create menu");
      console.error(err);
    }
  };

  const handleUpdateMenu = async (menuData: any) => {
    try {
      // First update the menu basic info
      const result = await updateMenu({
        id: selectedMenu.id,
        input: {
          name: menuData.name,
          slug: menuData.slug,
        },
      });

      if (result.error) {
        throw result.error;
      }

      if (result.data?.menuUpdate?.errors?.length) {
        throw new Error(
          result.data.menuUpdate.errors.map((error) => error.message || "Unknown error").join(", ")
        );
      }

      // Handle menu items
      const existingItemIds = selectedMenu.items.map((item: { id: string }) => item.id);
      const processedItems = menuData.items;

      // Delete existing items
      for (const itemId of existingItemIds) {
        try {
          const deleteResult = await deleteMenuItem({
            id: itemId,
          });

          if (deleteResult.error) {
            throw deleteResult.error;
          }

          if (deleteResult.data?.menuItemDelete?.errors?.length) {
            throw new Error(
              deleteResult.data.menuItemDelete.errors
                .map((error) => error.message || "Unknown error")
                .join(", ")
            );
          }
        } catch (err) {
          console.error("Failed to delete menu item:", err);
          throw err;
        }
      }

      // Create new items in order, keeping track of created items for parent references
      const createdItemIds = new Map<string, string>();

      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];
        try {
          const createResult = await createMenuItem({
            input: {
              menu: selectedMenu.id,
              name: item.name,
              category: item.category,
              collection: item.collection,
              page: item.page,
              parent: item.parent ? createdItemIds.get(item.parent) : undefined,
            },
          });

          if (createResult.error) {
            throw createResult.error;
          }

          if (createResult.data?.menuItemCreate?.errors?.length) {
            throw new Error(
              createResult.data.menuItemCreate.errors
                .map((error) => error.message || "Unknown error")
                .join(", ")
            );
          }

          // Store the created item's ID for parent references
          if (createResult.data?.menuItemCreate?.menuItem?.id) {
            createdItemIds.set(item.id, createResult.data.menuItemCreate.menuItem.id);
          }
        } catch (err) {
          console.error("Failed to create menu item:", err);
          throw err;
        }
      }

      setSelectedMenu(null);
      setIsModalOpen(false);
      refetchMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update menu");
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
    <Box __maxWidth="720px" padding={6}>
      <Box marginBottom={8}>
        <Text fontWeight="bold" as="h1" size={11}>
          Example Menu Manager
        </Text>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Text fontWeight="bold" as="h2" size={6}>
          Menus
        </Text>
        <Button onClick={() => setIsModalOpen(true)}>Create New Menu</Button>
      </Box>

      <Modal open={isModalOpen}>
        <Modal.Content>
          <Box
            __left="50%"
            __top="50%"
            __transform="translate(-50%, -50%)"
            __maxWidth="720px"
            width="100%"
            backgroundColor="default1"
            boxShadow="defaultModal"
            position="fixed"
            padding={8}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
              <Text as="h2" size={5}>
                {selectedMenu ? "Edit Menu" : "Create New Menu"}
              </Text>
              <Modal.Close>
                <Button
                  icon={<CloseIcon />}
                  size="small"
                  variant="tertiary"
                  onClick={() => {
                    setSelectedMenu(null);
                    setIsModalOpen(false);
                  }}
                />
              </Modal.Close>
            </Box>

            <MenuForm
              initialMenu={selectedMenu}
              onSubmit={selectedMenu ? handleUpdateMenu : handleCreateMenu}
              onClose={() => {
                setSelectedMenu(null);
                setIsModalOpen(false);
              }}
            />
          </Box>
        </Modal.Content>
      </Modal>

      <Box display="grid" gap={4}>
        {menus.map((menu) => (
          <Box key={menu.id} borderColor="default1" borderWidth={1} borderStyle="solid" padding={4}>
            <Box display="flex" justifyContent="space-between" marginBottom={4}>
              <Text size={5}>
                <b>{menu.name}</b> (id: {menu.id})
              </Text>
              <Box display="flex" gap={2}>
                <Button
                  icon={<EditIcon />}
                  variant="tertiary"
                  onClick={() => {
                    setSelectedMenu(menu);
                    setIsModalOpen(true);
                  }}
                >
                  Edit Menu
                </Button>
                <Button
                  icon={<TrashBinIcon />}
                  variant="tertiary"
                  onClick={() => handleDeleteMenu(menu.id)}
                >
                  Delete Menu
                </Button>
              </Box>
            </Box>
            <Text size={3} fontWeight="bold">
              Items
            </Text>
            {menu.items && menu.items.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "8px",
                        borderBottom: "1px solid var(--border-default1)",
                      }}
                    >
                      <Text fontWeight="bold" as="span">
                        ID
                      </Text>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "8px",
                        borderBottom: "1px solid var(--border-default1)",
                      }}
                    >
                      <Text fontWeight="bold" as="span">
                        Name
                      </Text>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "8px",
                        borderBottom: "1px solid var(--border-default1)",
                      }}
                    >
                      <Text fontWeight="bold" as="span">
                        Type
                      </Text>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "8px",
                        borderBottom: "1px solid var(--border-default1)",
                      }}
                    >
                      <Text fontWeight="bold" as="span">
                        Reference
                      </Text>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "8px",
                        borderBottom: "1px solid var(--border-default1)",
                      }}
                    >
                      <Text fontWeight="bold" as="span">
                        Level
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {menu.items.map((item) => (
                    <MenuItemRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
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
