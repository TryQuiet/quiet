export interface CreateCommunityProps {
    createCommunityAction: (name: string) => void
    redirectionAction: () => void
    networkCreated: boolean
    ready?: boolean
}
