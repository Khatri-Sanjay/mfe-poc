import { Routes } from "@angular/router";
import { loadRemoteModule } from "@angular-architects/native-federation";
import { authGuard } from "./core/guards/auth.guard";
import { AdminLayoutComponent } from "./layout/admin-layout.component";

export const routes: Routes = [
  // Remote auth routes — loaded from auth-app via Native Federation
  {
    path: "login",
    loadChildren: () =>
      loadRemoteModule("auth_app", "./routes").then((m) => m.routes),
  },

  // Admin routes (protected)
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: "products",
        loadComponent: () =>
          import("./features/products/product-list/product-list.component").then(
            (m) => m.ProductListComponent
          ),
      },
      {
        path: "products/:id",
        loadComponent: () =>
          import(
            "./features/products/product-editor/product-editor.component"
          ).then((m) => m.ProductEditorComponent),
      },
      {
        path: "categories",
        loadComponent: () =>
          import("./features/categories/categories.component").then(
            (m) => m.CategoriesComponent
          ),
      },
      {
        path: "brands",
        loadComponent: () =>
          import("./features/brands/brands.component").then(
            (m) => m.BrandsComponent
          ),
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./features/orders/orders.component").then(
            (m) => m.OrdersComponent
          ),
      },
      {
        path: "users",
        loadComponent: () =>
          import("./features/users/users.component").then(
            (m) => m.UsersComponent
          ),
      },
      {
        path: "reviews",
        loadComponent: () =>
          import("./features/reviews/reviews.component").then(
            (m) => m.ReviewsComponent
          ),
      },
      {
        path: "inventory",
        loadComponent: () =>
          import("./features/inventory/inventory.component").then(
            (m) => m.InventoryComponent
          ),
      },
      {
        path: "coupons",
        loadComponent: () =>
          import("./features/coupons/coupons.component").then(
            (m) => m.CouponsComponent
          ),
      },
      {
        path: "shipping",
        loadComponent: () =>
          import("./features/shipping/shipping.component").then(
            (m) => m.ShippingComponent
          ),
      },
      {
        path: "seed-data",
        loadComponent: () =>
          import("./features/seed-data/seed-data.component").then(
            (m) => m.SeedDataComponent
          ),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
