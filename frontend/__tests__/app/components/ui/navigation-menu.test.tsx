import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
} from '@/components/ui/navigation-menu';
import '@testing-library/jest-dom';

describe('NavigationMenu', () => {
  it('renders NavigationMenu with children', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/test">Test Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuIndicator />
      </NavigationMenu>
    );

    // Check that the trigger renders
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Content should not be visible initially
    expect(screen.queryByText('Test Link')).toBeNull();

    // Simulate clicking the trigger
    fireEvent.click(screen.getByText('Menu'));

    // The content should now appear
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });
});
